#!/usr/bin/env python3
"""
WebSocket handler for OpenAI Realtime API proxy
"""

import json
import asyncio
import websockets
from fastapi import WebSocket, WebSocketDisconnect
from prompts import DEFAULT_SESSION_CONFIG, FORM_COMPLETION_INSTRUCTIONS
from conversation_logger import ConversationLogger

OPENAI_WSS_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17'

class WebSocketHandler:
    def __init__(self, conversation_logger: ConversationLogger = None):
        self.conversation_logger = conversation_logger or ConversationLogger()
    
    async def establish_openai_connection(self, ephemeral_token: str, session_id: str, client_ws: WebSocket, mode: str = "form_creation", questions: list = None):
        """Establish WebSocket connection to OpenAI Realtime API"""
        try:
            openai_ws = await websockets.connect(
                OPENAI_WSS_URL,
                additional_headers={
                    'Authorization': f'Bearer {ephemeral_token}',
                    'OpenAI-Beta': 'realtime=v1'
                }
            )
            
            await client_ws.send_json({'type': 'connected', 'session_id': session_id})
            
            # Configure session with backend settings
            session_config = DEFAULT_SESSION_CONFIG.copy()
            
            # Customize instructions based on mode
            if mode == "form_completion" and questions:
                questions_text = "\n".join([
                    f"- {q.get('question', '')} (Type: {q.get('type_answer', q.get('type', 'text'))})"
                    for q in questions
                ])
                session_config['instructions'] = FORM_COMPLETION_INSTRUCTIONS.format(questions=questions_text)
            
            session_update_message = {
                'type': 'session.update',
                'session': session_config
            }
            await openai_ws.send(json.dumps(session_update_message))
            
            return openai_ws
        except Exception as error:
            await client_ws.send_json({'type': 'error', 'error': str(error)})
            raise

    async def handle_openai_message(self, openai_message: str, session_id: str, client_ws: WebSocket):
        """Handle messages from OpenAI Realtime API"""
        # Log conversation
        if session_id:
            try:
                openai_data = json.loads(openai_message)
                self.conversation_logger.log_openai_message(session_id, openai_data)
            except Exception as error:
                pass
        
        # Forward message to client
        try:
            await client_ws.send_text(openai_message)
        except Exception as error:
            # If we can't send to client, the connection is likely dead
            raise

    async def handle_client_disconnect(self, session_id: str, openai_ws):
        """Handle client disconnection cleanup"""
        # Save conversation
        if session_id:
            await self.conversation_logger.save_conversation(session_id)
        
        # Close OpenAI connection
        if openai_ws:
            await openai_ws.close()

    async def listen_to_openai(self, openai_ws, session_id: str, client_ws: WebSocket):
        """Listen to messages from OpenAI WebSocket and forward them to client"""
        try:
            async for message in openai_ws:
                if isinstance(message, str):
                    await self.handle_openai_message(message, session_id, client_ws)
                elif isinstance(message, bytes):
                    await client_ws.send_bytes(message)
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as error:
            try:
                await client_ws.send_json({
                    'type': 'error', 
                    'error': f'OpenAI connection error: {str(error)}'
                })
            except:
                # Client is likely disconnected, ignore send errors
                pass
