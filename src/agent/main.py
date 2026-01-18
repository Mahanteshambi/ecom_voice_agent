
import asyncio
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from root (since we are in src/agent, root is ../../)
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path, override=True)
    print(f"DEBUG: Loaded .env from {env_path}")
else:
    print(f"DEBUG: .env NOT FOUND at {env_path}")

# Debug API Key (Partial mask)
api_key = os.getenv("GOOGLE_API_KEY")
if api_key:
    print(f"DEBUG: GOOGLE_API_KEY found: {api_key[:5]}...")
    # Mirror to GEMINI_API_KEY just in case
    os.environ["GEMINI_API_KEY"] = api_key
else:
    print("DEBUG: GOOGLE_API_KEY NOT FOUND in env")

# Cleanse conflicting env vars
for key in ["GOOGLE_GENAI_USE_VERTEXAI", "GOOGLE_CLOUD_PROJECT", "GOOGLE_CLOUD_LOCATION", "GOOGLE_APPLICATION_CREDENTIALS"]:
    if key in os.environ:
        del os.environ[key]
        print(f"DEBUG: Removed conflicting env var {key}")

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
from google import genai
from google.genai import types
from google.adk.agents.live_request_queue import LiveRequestQueue

from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

from my_agent.agent import agent

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("AgentServer")

app = FastAPI()
APP_NAME = "astral-granule"

session_service = InMemorySessionService()
runner = Runner(app_name=APP_NAME, agent=agent, session_service=session_service)

@app.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("Client connected")
    await websocket.accept()
    
    # We use a static session for this prototype for simplicity, or generate one
    user_id = "user_default"
    session_id = "session_default"

    live_request_queue = LiveRequestQueue()
    
    # Config for Bidi Streaming
    run_config = RunConfig(
        streaming_mode=StreamingMode.BIDI,
        response_modalities=[types.Modality.AUDIO],
    )

    # Initialize Session
    session = await session_service.get_session(app_name=APP_NAME, user_id=user_id, session_id=session_id)
    if not session:
        await session_service.create_session(app_name=APP_NAME, user_id=user_id, session_id=session_id)

    async def receive_from_client():
        try:
            while True:
                # Receive can be text (JSON) or bytes (Audio)
                message = await websocket.receive()
                
                if "bytes" in message:
                    # Raw PCM Audio
                    pcm_data = message["bytes"]
                    if len(pcm_data) > 0:
                        pass
                       # print(f"DEBUG: Audio chunk {len(pcm_data)} bytes") # Log with newline
                    
                    audio_blob = types.Blob(
                        mime_type="audio/pcm;rate=16000", data=pcm_data
                    )
                    live_request_queue.send_realtime(audio_blob)
                    continue
                
                if "text" in message:
                    logger.info(f"Received text message: {message['text'][:50]}")
                    try:
                        data = json.loads(message["text"])
                        msg_type = data.get("type")
                        
                        if msg_type == "text":
                            live_request_queue.send_content(types.Content(parts=[types.Part(text=data["text"])]))
                        elif msg_type == "image":
                            # data["data"] is base64 encoded image
                            import base64
                            image_data = base64.b64decode(data["data"])
                            # Assuming mimeType is passed or default to jpeg
                            mime_type = data.get("mimeType", "image/jpeg")
                            # Ensure we don't send extremely large images, or resize if needed
                            # For now, just wrap in types.Part
                            part = types.Part.from_bytes(data=image_data, mime_type=mime_type)
                            live_request_queue.send_content(part)
                            
                    except json.JSONDecodeError:
                        logger.error("Failed to parse Text JSON")
                        
        except WebSocketDisconnect:
            logger.info("Client disconnected")
        except Exception as e:
            logger.error(f"Error receiving from client: {e}")

    async def send_to_client():
        try:
            async for event in runner.run_live(
                user_id=user_id,
                session_id=session_id,
                live_request_queue=live_request_queue,
                run_config=run_config
            ):
                # Send the full event as JSON
                event_json = event.model_dump_json(exclude_none=True, by_alias=True)
                
                # DEBUG: Check if model hears us
                if "outputTranscription" in event_json:
                     print(f"DEBUG TRANSCRIPT: {event_json[:300]}")

                # Intercept Tool Calls (Executable Code) and forward to Frontend
                try:
                    data = json.loads(event_json)
                    # Check for executable code
                    if "content" in data and "parts" in data["content"]:
                         for part in data["content"]["parts"]:
                            print(f"DEBUG PART KEYS: {part.keys()}") # INSPECT WHAT WE GET
                            # Handle Structured Function Calls
                            if "functionCall" in part:
                                fc = part["functionCall"]
                                if fc.get("name") == "update_ui":
                                    args = fc.get("args", {})
                                    tool_msg = {
                                        "toolCalls": [{
                                            "functionCalls": [{
                                                "name": "update_ui",
                                                "args": args
                                            }]
                                        }]
                                    }
                                    await websocket.send_text(json.dumps(tool_msg))
                                    logger.info(f"FORWARDED FUNCTION CALL: {args}")

                            # Handle Executable Code (Python)
                            if "executableCode" in part:
                                code = part["executableCode"].get("code", "")
                                if "update_ui" in code:
                                    # Simple regex parsing for the prototype
                                    # Expected: default_api.update_ui(action='FILTER', target='MacBook Pro')
                                    # Robust AST parsing
                                    print(f"DEBUG CODE: {code}") # SEE WHAT MODEL WROTE
                                    import ast
                                    try:
                                        tree = ast.parse(code)
                                        found_call = False
                                        for node in ast.walk(tree):
                                            if isinstance(node, ast.Call):
                                                # Handle plain functions: update_ui(...)
                                                is_func = hasattr(node.func, 'id') and node.func.id == 'update_ui'
                                                # Handle methods: tools.update_ui(...)
                                                is_method = hasattr(node.func, 'attr') and node.func.attr == 'update_ui'
                                                
                                                if is_func or is_method:
                                                    found_call = True
                                                    # Extract arguments
                                                    args = {}
                                                    for keyword in node.keywords:
                                                        if isinstance(keyword.value, ast.Constant):
                                                            args[keyword.arg] = keyword.value.value
                                                    
                                                    action = args.get('action')
                                                    target = args.get('target')
                                                    details = args.get('details', '') # Default to empty string if missing
                                                    
                                                    if action and target:
                                                        tool_msg = {
                                                            "toolCalls": [{
                                                                "functionCalls": [{
                                                                    "name": "update_ui",
                                                                    "args": {"action": action, "target": target}
                                                                }]
                                                            }]
                                                        }
                                                        await websocket.send_text(json.dumps(tool_msg))
                                                    print(f"FORWARDED TOOL CALL: {action} {target}")
                                        
                                        if not found_call:
                                            print("DEBUG: AST parsed code but found NO update_ui calls")
                                    except Exception as parse_error:
                                        print(f"AST Parsing Warning: {parse_error}")

                except Exception as e:
                    print(f"Error parsing event for tools: {e}")
                    pass 
                
                await websocket.send_text(event_json)

        except Exception as e:
            logger.error(f"Error in send_to_client: {e}")
            logger.exception("Traceback:")

    try:
        await asyncio.gather(receive_from_client(), send_to_client())
    finally:
        live_request_queue.close()
        logger.info("Session closed")

if __name__ == "__main__":
    import uvicorn
    # Use 0.0.0.0 to allow access if needed, but localhost is fine for local
    uvicorn.run(app, host="127.0.0.1", port=8080)
