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
FORM_COMPLETION_DISCUSSIONS_DIR = BACKEND_DIR / 'discussions_form_completion'
ANALYSIS_DIR = BACKEND_DIR / 'analysis'
FORM_COMPLETION_ANALYSIS_DIR = BACKEND_DIR / 'analysis_form_completion'

# Create directories
DISCUSSIONS_DIR.mkdir(exist_ok=True)
FORM_COMPLETION_DISCUSSIONS_DIR.mkdir(exist_ok=True)
ANALYSIS_DIR.mkdir(exist_ok=True)
FORM_COMPLETION_ANALYSIS_DIR.mkdir(exist_ok=True)

class ConversationItem:
    def __init__(self, speaker: str, content: str, timestamp: datetime, is_delta: bool = False):
        self.speaker = speaker
        self.content = content
        self.timestamp = timestamp
        self.is_delta = is_delta

class DiscussionSession:
    def __init__(self, session_id: str, mode: str = 'form_creation'):
        self.session_id = session_id
        self.mode = mode  # 'form_creation' or 'form_completion'
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
    
    def start_session(self, session_id: str = None, mode: str = 'form_creation') -> str:
        """Start a new conversation session"""
        if not session_id:
            session_id = self.generate_session_id()
        
        self.active_discussions[session_id] = DiscussionSession(session_id, mode)
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
            
            # Choose directory based on session mode
            if discussion.mode == 'form_completion':
                filepath = FORM_COMPLETION_DISCUSSIONS_DIR / filename
            else:
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
    
    async def get_session_transcript(self, session_id: str, mode: str = 'form_completion') -> Optional[str]:
        """Get the formatted transcript for a session."""
        try:
            print(f"Looking for transcript for session: {session_id} (mode: {mode})")
            print(f"BACKEND_DIR: {BACKEND_DIR}")
            print(f"FORM_COMPLETION_DISCUSSIONS_DIR: {FORM_COMPLETION_DISCUSSIONS_DIR}")
            print(f"DISCUSSIONS_DIR: {DISCUSSIONS_DIR}")
            print(f"Current working directory: {Path.cwd()}")
            
            # First check if session is still active
            if session_id in self.active_discussions:
                print("Session found in active discussions")
                discussion = self.active_discussions[session_id]
                return self.format_conversation(discussion.conversation)
            
            # Choose directory based on mode
            search_dirs = []
            if mode == 'form_completion':
                search_dirs = [FORM_COMPLETION_DISCUSSIONS_DIR, DISCUSSIONS_DIR]  # Fallback to main dir
                print(f"Form completion mode - will search in: {[str(d) for d in search_dirs]}")
            else:
                search_dirs = [DISCUSSIONS_DIR]
                print(f"Form creation mode - will search in: {[str(d) for d in search_dirs]}")
            
            # Look for saved conversation file in appropriate directories
            pattern = f"conversation_{session_id}_*.txt"
            print(f"Looking for files with pattern: {pattern}")
            
            conversation_files = []
            for i, search_dir in enumerate(search_dirs):
                print(f"\n=== SEARCHING DIRECTORY {i+1}/{len(search_dirs)}: {search_dir.name} ===")
                print(f"Searching in directory: {search_dir}")
                print(f"Absolute path: {search_dir.absolute()}")
                print(f"Directory exists: {search_dir.exists()}")
                
                if not search_dir.exists():
                    print(f"Directory {search_dir} does not exist! Skipping...")
                    continue
                    
                all_files = list(search_dir.glob("*.txt"))
                print(f"All txt files in {search_dir.name}: {[f.name for f in all_files]}")
                
                # Test if any file matches our session ID manually
                matching_files = [f for f in all_files if session_id in f.name]
                print(f"Files containing session_id '{session_id}': {[f.name for f in matching_files]}")
                
                # Try both glob and manual filtering
                files = list(search_dir.glob(pattern))
                print(f"Glob found {len(files)} files matching pattern: {[f.name for f in files]}")
                
                # Alternative: manual filtering with os.listdir
                import os
                try:
                    manual_files = []
                    for filename in os.listdir(search_dir):
                        if filename.endswith('.txt') and session_id in filename:
                            manual_files.append(search_dir / filename)
                    print(f"Manual search found {len(manual_files)} files: {[f.name for f in manual_files]}")
                    
                    # Use manual results if glob failed
                    if not files and manual_files:
                        files = manual_files
                        print("Using manual search results since glob failed")
                except Exception as e:
                    print(f"Manual search failed: {e}")
                
                # FALLBACK: If no exact match found, use the most recent file as a last resort
                if not files and all_files and i == 0:  # Only for form_completion directory
                    print("No exact session match found. Trying fallback: most recent file")
                    most_recent = max(all_files, key=lambda x: x.stat().st_mtime)
                    print(f"Most recent file: {most_recent.name}")
                    print(f"File age: {(datetime.now().timestamp() - most_recent.stat().st_mtime)} seconds old")
                    
                    # Only use if it's very recent (within last 5 minutes)
                    if (datetime.now().timestamp() - most_recent.stat().st_mtime) < 300:
                        files = [most_recent]
                        print("Using most recent file as fallback (within 5 minutes)")
                    else:
                        print("Most recent file too old, skipping fallback")
                
                conversation_files.extend(files)
                print(f"Final files added from {search_dir.name}: {[f.name for f in files]}")
                
                # If we found files, we can break early (optional)
                if files:
                    print(f"Found files in {search_dir.name}, stopping search")
                    break
            
            if not conversation_files:
                import os
                print(f"{os.getcwd()=}")
                print(f"{Path.cwd()=}")
                print(f"{search_dirs=}")
                print(f"{conversation_files=}")
                print(f"{pattern=}")
                print("No conversation files found in any directory")
                return None
            
            # Get the most recent file for this session
            latest_file = max(conversation_files, key=lambda x: x.stat().st_mtime)
            print(f"Using file: {latest_file.name}")
            
            async with aiofiles.open(latest_file, 'r', encoding='utf8') as f:
                content = await f.read()
            
            print(f"File content length: {len(content)}")
            
            # Extract just the conversation part (after the header)
            lines = content.split('\n')
            start_index = 0
            for i, line in enumerate(lines):
                if line.startswith('=' * 80):
                    start_index = i + 1
                    break
            
            transcript = '\n'.join(lines[start_index:]).strip()
            print(f"Extracted transcript length: {len(transcript)}")
            
            return transcript
            
        except Exception as error:
            print(f"Error getting session transcript: {error}")
            import traceback
            traceback.print_exc()
            return None
    
    async def save_form_completion_analysis(self, session_id: str, analysis: str):
        """Save form completion analysis to a dedicated file."""
        try:
            analysis_filename = f"{session_id}_form_completion_analysis.txt"
            analysis_path = FORM_COMPLETION_ANALYSIS_DIR / analysis_filename
            
            timestamp = datetime.now().isoformat()
            content = f"FORM COMPLETION ANALYSIS\n{'='*25}\n"
            content += f"Session ID: {session_id}\n"
            content += f"Analyzed: {timestamp}\n\n"
            content += analysis
            
            async with aiofiles.open(analysis_path, 'w', encoding='utf8') as f:
                await f.write(content)
                
        except Exception as error:
            print(f"Error saving form completion analysis: {error}")
            pass