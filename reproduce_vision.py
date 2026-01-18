
import asyncio
import websockets
import json
import base64

async def test_vision():
    uri = "ws://localhost:8080"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to server")
            
            # 1. Send Text
            # await websocket.send(json.dumps({
            #     "type": "text",
            #     "text": "Hello, can you see this image?"
            # }))
            
            # 2. Send Image (Dummy 1x1 pixel)
            # 1x1 white pixel jpeg
            dummy_b64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWprbG1ub3O0ubLb3N/h4t/k5ebn6Onq8fLz9PX29/j5+v/sA2wEAAhEBAgAA/wAAVP/aAAwDAQACEQMRAD8C/wAA/9k="
            await websocket.send(json.dumps({
                "type": "image",
                "data": dummy_b64,
                "mimeType": "image/jpeg"
            }))
            print("Sent Message with Image")
            
            # Listen for a bit
            async for message in websocket:
                print(f"Received: {message[:100]}...")
                # Break after a few seconds or response
                break
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_vision())
