#!/usr/bin/env python3
"""
Conversation logging for OpenAI Realtime API
"""

import json
import aiofiles
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import random
import string

# Storage configuration
BACKEND_DIR = Path(__file__).parent
DISCUSSIONS_DIR = BACKEND_DIR / 'discussions'
ANALYSIS_DIR = BACKEND_DIR / 'analysis'
DISCUSSIONS_DIR.mkdir(exist_ok=True)
ANALYSIS_DIR.mkdir(exist_ok=True)

class ConversationItem:
    def __init__(self, speaker: str, content: str, timestamp: datetime, is_delta: bool = False):
        self.speaker = speaker
        self.content = content
        self.timestamp = timestamp
        self.is_delta = is_delta

class DiscussionSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.conversation: List[ConversationItem] = []
        self.start_time = datetime.now()
        self.is_saved = False  # Track if conversation has been saved

class ConversationLogger:
    def __init__(self):
        self.active_discussions: Dict[str, DiscussionSession] = {}
    
    def generate_session_id(self) -> str:
        """Generate a unique session ID"""
        timestamp = int(datetime.now().timestamp() * 1000)
        random_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=9))
        return f"session_{timestamp}_{random_part}"
    
    def start_session(self, session_id: str = None) -> str:
        """Start a new conversation session"""
        if not session_id:
            session_id = self.generate_session_id()
        
        self.active_discussions[session_id] = DiscussionSession(session_id)
        return session_id
    
    def extract_conversation_content(self, message_type: str, message: Dict) -> Optional[ConversationItem]:
        """Extract meaningful conversation content from messages"""
        message_msg_type = message.get('type', 'unknown')
        
        if message_type == 'CLIENT':
            skip_types = ['input_audio_buffer.append', 'connect', 'session.update']
            if message_msg_type in skip_types:
                return None
        
        if message_type == 'OPENAI':
            # Extract user transcripts
            if message_msg_type == 'conversation.item.input_audio_transcription.completed':
                transcript = message.get('transcript', '[No transcript]')
                return ConversationItem(
                    speaker='User',
                    content=transcript,
                    timestamp=datetime.now()
                )
            
            # Extract assistant responses
            if message_msg_type in ['response.audio_transcript.delta', 'response.text.delta']:
                delta = message.get('delta', '')
                return ConversationItem(
                    speaker='Assistant',
                    content=delta,
                    timestamp=datetime.now(),
                    is_delta=True
                )
            
        
        return None
    
    def log_client_message(self, session_id: str, data: Dict):
        """Log client message"""
        if session_id in self.active_discussions:
            discussion = self.active_discussions[session_id]
            conversation_item = self.extract_conversation_content('CLIENT', data)
            if conversation_item:
                discussion.conversation.append(conversation_item)
    
    def log_openai_message(self, session_id: str, data: Dict):
        """Log OpenAI message"""
        if session_id in self.active_discussions:
            discussion = self.active_discussions[session_id]
            conversation_item = self.extract_conversation_content('OPENAI', data)
            if conversation_item:
                discussion.conversation.append(conversation_item)
    
    def format_conversation(self, conversation: List[ConversationItem]) -> str:
        """Format conversation items into readable text"""
        content = ''
        current_assistant_message = ''
        last_speaker = ''
        
        for item in conversation:
            if item.speaker == 'User':
                if current_assistant_message.strip() and last_speaker == 'Assistant':
                    content += f"Assistant: {current_assistant_message.strip()}\n\n"
                    current_assistant_message = ''
                content += f"User: {item.content}\n\n"
                last_speaker = 'User'
            elif item.speaker == 'Assistant':
                if item.is_delta:
                    current_assistant_message += item.content
                else:
                    if current_assistant_message.strip():
                        content += f"Assistant: {current_assistant_message.strip()}\n\n"
                        current_assistant_message = ''
                    content += f"Assistant: {item.content}\n\n"
                last_speaker = 'Assistant'
        
        if current_assistant_message.strip():
            content += f"Assistant: {current_assistant_message.strip()}\n\n"
        
        return content
    
    async def save_conversation(self, session_id: str) -> Optional[str]:
        """Save conversation to file"""
        if session_id not in self.active_discussions:
            return None
        
        discussion = self.active_discussions[session_id]
        
        # Check if already saved to prevent double-save
        if discussion.is_saved:
            return None
        
        # Mark as saved to prevent double-save attempts
        discussion.is_saved = True
        
        if not discussion.conversation:
            # Still delete the session, but at the very end of this method
            try:
                del self.active_discussions[session_id]
            except KeyError:
                pass
            return None
        
        try:
            timestamp = datetime.now().isoformat().replace(':', '-').replace('.', '-')
            filename = f"conversation_{session_id}_{timestamp}.txt"
            filepath = DISCUSSIONS_DIR / filename
            
            content = f"Conversation Session: {session_id}\n"
            content += f"Started: {discussion.start_time.isoformat()}\n"
            content += f"Ended: {datetime.now().isoformat()}\n"
            content += f"Messages: {len(discussion.conversation)}\n"
            content += '=' * 80 + '\n\n'
            formatted_content = self.format_conversation(discussion.conversation)
            content += formatted_content
            
            async with aiofiles.open(filepath, 'w', encoding='utf8') as f:
                await f.write(content)
            
            # Analyze with ChatGPT-4o
            await self.analyze_conversation(filepath, session_id)
            
            # Safe session cleanup
            try:
                del self.active_discussions[session_id]
            except KeyError:
                pass
            
            return filename
        except Exception as error:
            # Clean up session even on error
            try:
                del self.active_discussions[session_id]
            except KeyError:
                pass
            
            return None
    
    async def analyze_conversation(self, filepath: Path, session_id: str):
        """Analyze conversation with ChatGPT-4o and save to analysis folder."""
        try:
            from chatgpt_parser import parse_transcript_with_chatgpt
            
            # Read conversation file
            async with aiofiles.open(filepath, 'r', encoding='utf8') as f:
                transcript_content = await f.read()
            
            # Parse with ChatGPT-4o
            analysis = await parse_transcript_with_chatgpt(transcript_content)
            
            # Save analysis in dedicated folder
            analysis_filename = f"{session_id}_analysis.txt"
            analysis_path = ANALYSIS_DIR / analysis_filename
            
            async with aiofiles.open(analysis_path, 'w', encoding='utf8') as f:
                await f.write(f"USER INTENT ANALYSIS\n{'='*20}\n\n{analysis}")
            
        except Exception as error:
            pass
