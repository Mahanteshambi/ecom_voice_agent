
import asyncio
import websockets
import json
import base64

async def test_audio():
    uri = "ws://127.0.0.1:8080"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to server")
            
            # Send Dummy Audio (Silence)
            # 16kHz 16-bit mono PCM = 32000 bytes/sec
            # Send 0.1s chunk = 3200 bytes
            dummy_pcm = b'\x00' * 3200
            
            await websocket.send(dummy_pcm)
            print("Sent Audio Message")
            
            # Listen
            async for message in websocket:
                print(f"Received: {str(message)[:100]}...")
                # Break after a bit
                await asyncio.sleep(1)
                break
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_audio())
