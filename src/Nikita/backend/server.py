#!/usr/bin/env python3
"""
OpenAI Realtime API Proxy Server - Minimal Version

A lightweight proxy server between clients and OpenAI's Realtime API.
"""

import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

# Local imports
from api_routes import health_check, create_session, get_session_config, generate_form_from_latest_session, generate_form_answers_from_session
from websocket_handler import WebSocketHandler
from conversation_logger import ConversationLogger

# ============================================================================
# SETUP
# ============================================================================

load_dotenv()

app = FastAPI(title="OpenAI Realtime Proxy Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PORT = int(os.getenv("PORT", 3001))

# Initialize handlers
conversation_logger = ConversationLogger()
websocket_handler = WebSocketHandler(conversation_logger)

# ============================================================================
# API ROUTES
# ============================================================================

@app.get("/health")
async def health():
    return await health_check()

@app.post("/api/session")
async def session():
    return await create_session()

@app.get("/api/session/config")
async def session_config():
    return await get_session_config()

@app.get("/api/generate-form")
async def generate_form():
    """Generate form JSON from the latest conversation analysis"""
    return await generate_form_from_latest_session()

@app.post("/api/generate-form-answers")
async def generate_form_answers(request_data: dict):
    """Generate form answers from a conversation session"""
    print(f"Received request data: {request_data}")
    
    session_id = request_data.get('session_id')
    questions = request_data.get('questions', [])
    
    print(f"Session ID: {session_id}")
    print(f"Questions: {len(questions) if questions else 0}")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    if not questions:
        raise HTTPException(status_code=400, detail="questions are required")
    
    return await generate_form_answers_from_session(session_id, questions)

# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket connection handler"""
    await websocket.accept()
    
    openai_ws = None
    is_connected = False
    session_id = conversation_logger.start_session()
    
    try:
        while True:
            try:
                message = await websocket.receive()
            except WebSocketDisconnect:
                break
            except Exception as e:
                break
            
            if message.get("type") == "websocket.receive":
                if "bytes" in message:
                    # Handle binary messages (audio data)
                    if openai_ws and is_connected:
                        await openai_ws.send(message["bytes"])
                elif "text" in message:
                    # Handle JSON messages
                    try:
                        data = json.loads(message["text"])
                        
                        # Log client message
                        conversation_logger.log_client_message(session_id, data)
                        
                        # Handle connection
                        if data.get('type') == 'connect' and data.get('ephemeralToken'):
                            mode = data.get('mode', 'form_creation')
                            questions = data.get('questions', [])
                            
                            openai_ws = await websocket_handler.establish_openai_connection(
                                data['ephemeralToken'], session_id, websocket, mode, questions
                            )
                            is_connected = True
                            
                            # Start listening to OpenAI messages
                            asyncio.create_task(
                                websocket_handler.listen_to_openai(openai_ws, session_id, websocket)
                            )
                        elif openai_ws and is_connected:
                            # Block session.update from frontend
                            if data.get('type') == 'session.update':
                                continue
                            
                            # Forward other messages to OpenAI
                            await openai_ws.send(message["text"])
                            
                    except json.JSONDecodeError as error:
                        await websocket.send_json({
                            'type': 'error', 
                            'error': 'Invalid JSON message'
                        })
                    except Exception as error:
                        await websocket.send_json({
                            'type': 'error', 
                            'error': str(error)
                        })
                        
    except WebSocketDisconnect:
        pass
    except Exception as error:
        pass
    finally:
        await websocket_handler.handle_client_disconnect(session_id, openai_ws)

# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    print('=' * 60)
    print(f'🚀 OpenAI Realtime Proxy Server running on port {PORT}')
    print('=' * 60)
    print(f'📡 WebSocket endpoint: ws://localhost:{PORT}/ws')
    print(f'🔑 Session endpoint: http://localhost:{PORT}/api/session')
    print(f'❤️  Health check: http://localhost:{PORT}/health')
    print('=' * 60)
    
    uvicorn.run(
        "server:app", 
        host="0.0.0.0", 
        port=PORT, 
        reload=True,
        log_level="info"
    )