"use client";

import { useEffect, useRef, useState } from 'react'; // Removed unused useCallback
import { useAgentSocket } from '@/hooks/useAgentSocket';
import { Mic, Video, VideoOff, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function LiveAssistant() {
    const { isConnected, sendAudioChunk, sendImageChunk, resumeAudio, sendText } = useAgentSocket();
    const [isMicOn, setIsMicOn] = useState(false); // Default off
    const [isCamOn, setIsCamOn] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Audio Recording Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // Start/Stop Mic (Using AudioWorklet)
    const toggleMic = async () => {
        // Resume playback context on interaction
        resumeAudio();

        if (isMicOn) {
            // Stop logic
            if (mediaRecorderRef.current) {
                // We use this ref to store the Context/Worklet cleanup function now
                (mediaRecorderRef.current as any)();
                mediaRecorderRef.current = null;
            }
            setIsMicOn(false);
        } else {
            try {
                // Initialize Audio Context
                const ctx = new AudioContext({ sampleRate: 16000 });
                await ctx.audioWorklet.addModule('/recorder-worklet.js');

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }
                });

                const source = ctx.createMediaStreamSource(stream);
                const workletNode = new AudioWorkletNode(ctx, 'recorder-worklet');

                workletNode.port.onmessage = (event) => {
                    if (!isConnected) return;
                    // event.data is ArrayBuffer (Int16 PCM)
                    // We need to convert it to base64 to match our useAgentSocket interface
                    // OR we update useAgentSocket to accept ArrayBuffer, but let's stick to the interface for now.
                    // Actually, useAgentSocket.sendAudioChunk expects base64 string.

                    const buffer = event.data;
                    const bytes = new Uint8Array(buffer);
                    let binary = '';
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const b64 = window.btoa(binary);
                    sendAudioChunk(b64);
                };

                source.connect(workletNode);
                workletNode.connect(ctx.destination); // Keep alive

                // Cleanup function
                mediaRecorderRef.current = (() => {
                    stream.getTracks().forEach(t => t.stop());
                    workletNode.disconnect();
                    source.disconnect();
                    ctx.close();
                }) as any;

                setIsMicOn(true);
            } catch (e) {
                console.error("Mic Error", e);
            }
        }
    };

    // Cleanup Mic
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current) {
                (mediaRecorderRef.current as any)();
            }
        };
    }, []);


    // Camera Logic (1 FPS)
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                interval = setInterval(() => {
                    if (!isConnected || !isCamOn || !videoRef.current || !canvasRef.current) return;

                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(videoRef.current, 0, 0, 320, 240); // Downscale
                        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6);
                        sendImageChunk(dataUrl);
                    }
                }, 1000); // 1 FPS

            } catch (e) {
                console.error("Camera Error", e);
                setIsCamOn(false);
            }
        };

        if (isCamOn) {
            startCamera();
        } else {
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(t => t.stop());
            }
        }

        return () => clearInterval(interval);
    }, [isCamOn, isConnected, sendImageChunk]);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

    // Expose a global function for the hook to call (hacky but effective for debug)
    useEffect(() => {
        (window as any).__SHOW_TOAST__ = (message: string) => {
            setToast({ message, type: 'success' });
            setTimeout(() => setToast(null), 3000);
        };
    }, []);

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4"
        >
            {/* Toast Notification */}
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-zinc-800 text-white px-4 py-2 rounded-lg shadow-xl border border-white/10 text-sm font-medium mb-2"
                >
                    {toast.message}
                </motion.div>
            )}

            {/* Vision Preview */}
            {isCamOn && (
                <div className="relative w-48 h-36 rounded-xl overflow-hidden border-2 border-indigo-500/50 shadow-2xl bg-black">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} width={320} height={240} className="hidden" />
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center">
                        <Activity className="w-3 h-3 mr-1 text-red-500 animate-pulse" />
                        Live Vision
                    </div>
                </div>
            )}

            {/* Control Bar */}
            <div className="flex items-center space-x-2 bg-zinc-900/90 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-xl">
                {/* Connection Status */}
                <div className={cn("w-3 h-3 rounded-full mx-2", isConnected ? "bg-green-500" : "bg-red-500")} />

                <button
                    onClick={toggleMic}
                    className={cn(
                        "p-3 rounded-full transition-all",
                        isMicOn ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    )}
                >
                    <Mic className="w-5 h-5" />
                </button>

                <button
                    onClick={() => setIsCamOn(!isCamOn)}
                    className={cn(
                        "p-3 rounded-full transition-all",
                        isCamOn ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                    )}
                >
                    {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>


            </div>
        </motion.div>
    );
}
