#!/usr/bin/env python3
"""
Simple prompts configuration for OpenAI Realtime API
"""

# System instructions
DEFAULT_INSTRUCTIONS = """
You are a focused assistant. Guide the user in defining the key information to create a form. 
Be concise, direct, and structured. Ask only essential questions (purpose, target audience, 
type of fields, expected outputs). Do not repeat information that is already clear and precise. 
If something is vague, clarify it. If something is clear, move forward and suggest only 
what adds value or fills gaps. Stay straight to the point, no small talk.
"""

# Voice configuration
DEFAULT_VOICE = "alloy"

# Session configuration
DEFAULT_SESSION_CONFIG = {
    "instructions": DEFAULT_INSTRUCTIONS,
    "voice": DEFAULT_VOICE,
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "input_audio_transcription": {"model": "whisper-1"},
    "turn_detection": {
        "type": "server_vad",
        "threshold": 0.65,
        "prefix_padding_ms": 300,
        "silence_duration_ms": 300,
        "create_response": True,
        "interrupt_response": True
    }
}

# ChatGPT-4o parsing prompt
TRANSCRIPT_ANALYSIS_PROMPT = """Analyze this conversation transcript and clearly outline what the user wants or is trying to achieve.

Transcript:
{transcript}

Please provide:
1. User's main intent/goal
2. Key requests or needs mentioned
3. Any specific actions they want taken

Keep your response concise and focused on the user's will/intent."""

# Form generation prompt for converting analysis to JSON
FORM_GENERATION_PROMPT = """Based on the following conversation analysis, create a form structure in JSON format.

Analysis:
{analysis}

Generate a JSON response with the following structure:
{{
  "title": "Clear, descriptive form title that reflects the main purpose discussed in the conversation",
  "description": "Detailed description explaining what this form is for and how responses will be used, based on the conversation context",
  "questions": [
    {{
      "id": "unique_id",
      "question": "Question text",
      "type": "text|email|textarea|radio|checkbox|select|number|date|time|url|tel",
      "required": true/false,
      "options": ["option1", "option2"] // only for radio, checkbox, select types
    }}
  ]
}}

Important instructions for title and description:
- Title: Create a concise but descriptive title (3-8 words) that clearly indicates what the form is about
- Description: Write 1-2 sentences explaining the form's purpose, who should fill it out, and what will happen with the responses
- Base both title and description on the specific context and intent expressed in the conversation

Create relevant questions based on what the user discussed. Use appropriate field types and make required fields logical.
Return only valid JSON, no additional text or explanation."""