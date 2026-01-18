"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/context/StoreContext';

const AGENT_WS_URL = 'ws://localhost:8080';

export function useAgentSocket() {
    const { dispatch } = useStore();
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);

    // Initialize Audio Context for playback
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    const resumeAudio = useCallback(async () => {
        if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
            console.log("AudioContext resumed");
        }
    }, []);

    const playNextInQueue = useCallback(async () => {
        if (!audioContextRef.current || audioQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            return;
        }

        // Ensure context is running
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        isPlayingRef.current = true;
        const audioData = audioQueueRef.current.shift()!;

        const buffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
        buffer.getChannelData(0).set(audioData);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = playNextInQueue;
        source.start();
    }, []);

    const handleAudioMessage = useCallback((base64Data: string) => {
        try {
            // Fix URL-Safe Base64 to Standard Base64 for atob
            const standardBase64 = base64Data.replace(/-/g, '+').replace(/_/g, '/');
            const binaryString = window.atob(standardBase64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            // Gemini usually sends 24kHz PCM 16-bit
            const samples = new Float32Array(bytes.length / 2);
            const dataView = new DataView(bytes.buffer);
            for (let i = 0; i < samples.length; i++) {
                const int16 = dataView.getInt16(i * 2, true);
                samples[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7FFF;
            }

            audioQueueRef.current.push(samples);
            if (!isPlayingRef.current) {
                playNextInQueue();
            }
        } catch (e) {
            console.error("Error decoding audio", e);
        }
    }, [playNextInQueue]);

    useEffect(() => {
        const ws = new WebSocket(AGENT_WS_URL);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('Connected to Agent Server');
            setIsConnected(true);
        };

        ws.onclose = () => {
            console.log('Disconnected from Agent Server');
            setIsConnected(false);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                // console.log("Received Event:", message); // Verbose

                // 1. Handle Audio from server_content.model_turn.parts OR content.parts
                // The ADK sometimes sends { serverContent: { modelTurn: { parts: ... } } }
                // and sometimes just { content: { parts: ... } } depending on version/wrapping.
                const parts = message.serverContent?.modelTurn?.parts || message.content?.parts;

                if (parts) {
                    for (const part of parts) {
                        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                            handleAudioMessage(part.inlineData.data);
                        }
                    }
                }

                // 2. Handle Tool Calls
                if (message.toolCalls) {
                    console.log("DEBUG: Received toolCalls", message.toolCalls); // ADDED
                    for (const toolCall of message.toolCalls) {
                        for (const func of toolCall.functionCalls) {
                            if (func.name === 'update_ui') {
                                console.log("Executing Agent Action:", func.args);
                                const args = func.args;

                                switch (args.action) {
                                    case 'FILTER':
                                        console.log("DEBUG: Dispatching FILTER_PRODUCTS with", args.target);
                                        (window as any).__SHOW_TOAST__?.(`Filtering: ${args.target}`);
                                        dispatch({ type: 'FILTER_PRODUCTS', payload: args.target });
                                        break;
                                    case 'HIGHLIGHT':
                                        console.log("DEBUG: Dispatching HIGHLIGHT_PRODUCT with", args.target); // ADDED
                                        (window as any).__SHOW_TOAST__?.(`Highlighting: ${args.target}`);
                                        dispatch({ type: 'HIGHLIGHT_PRODUCT', payload: args.target });
                                        setTimeout(() => dispatch({ type: 'HIGHLIGHT_PRODUCT', payload: null }), 5000);
                                        break;
                                    case 'ADD_TO_CART':
                                        // eslint-disable-next-line
                                        const product = (window as any).__INVENTORY__?.find((p: any) => p.id === args.target || p.name.includes(args.target));
                                        if (product) {
                                            (window as any).__SHOW_TOAST__?.(`Added to Cart: ${product.name}`);
                                            dispatch({ type: 'ADD_TO_CART', payload: product });
                                        }
                                        break;
                                    case 'NAVIGATE':
                                        if (args.target.toLowerCase().includes('checkout')) {
                                            (window as any).__SHOW_TOAST__?.("Navigating to Checkout");
                                            dispatch({ type: 'NAVIGATE_CHECKOUT' });
                                        } else {
                                            (window as any).__SHOW_TOAST__?.("Resetting View");
                                            dispatch({ type: 'NAVIGATE_HOME' });
                                            dispatch({ type: 'FILTER_PRODUCTS', payload: '' });
                                        }
                                        break;
                                    default: // ADDED
                                        console.warn("DEBUG: Unknown action", args.action);
                                }
                            }
                        }
                    }
                } // 2. Handle Tool Calls
            } catch (e) {
                console.error("Error parsing WS message", e);
            }
        };

        return () => {
            ws.close();
        };
    }, [dispatch, handleAudioMessage]);

    // Send RAW Binary Audio
    const sendAudioChunk = (base64Audio: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            // Convert base64 to binary for transmission
            const binaryString = window.atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            socketRef.current.send(bytes);
        }
    };

    const sendImageChunk = (base64Image: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            // Send as JSON text message
            const data = base64Image.split(',')[1];
            socketRef.current.send(JSON.stringify({
                type: "image",
                data: data,
                mimeType: "image/jpeg"
            }));
        }
    };

    // Send Text Command
    const sendText = (text: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'text', text }));
        }
    };

    return { isConnected, sendAudioChunk, sendImageChunk, resumeAudio, sendText };
}
