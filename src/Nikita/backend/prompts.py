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

# Form completion instructions for voice assistant
FORM_COMPLETION_INSTRUCTIONS = """
You are a helpful assistant that guides users through completing a form via voice conversation. 
Your goal is to collect natural, conversational answers to the form questions.

Here are the form questions you need to collect answers for:
{questions}

Guidelines:
- Ask questions in a natural, conversational way
- Allow users to provide answers in their own words
- Ask follow-up questions for clarification if needed
- Be encouraging and supportive
- If a user seems unsure, offer examples or guidance
- Keep the conversation flowing naturally
- Once you have collected answers for all questions, summarize what you've gathered and confirm with the user

Remember: This is a voice conversation, so speak naturally and be conversational rather than robotic.
"""

# Form completion analysis prompt
FORM_COMPLETION_ANALYSIS_PROMPT = """Analyze this conversation transcript where a user was answering form questions via voice.

Form Questions:
{questions}

Conversation Transcript:
{transcript}

Please extract the user's answers and provide:
1. User's responses to each question (be specific about which question each answer addresses)
2. Any clarifications or additional context provided
3. Questions that may not have been fully answered

Keep your response structured and focused on extracting the actual answers provided."""

# Form answers generation prompt for converting analysis to structured answers
FORM_ANSWERS_GENERATION_PROMPT = """Based on the following conversation analysis, extract and format the user's answers to the form questions.

Form Questions:
{questions}

Analysis:
{analysis}

Generate a JSON response with the following structure:
{{
  "answers": {{
    "question_id_1": "user's answer for question 1",
    "question_id_2": "user's answer for question 2"
  }},
  "confidence": "high|medium|low",
  "missing_answers": ["question_id_x", "question_id_y"],
  "notes": "Any additional context or clarifications"
}}

Instructions:
- Extract the user's actual answers from the conversation
- Match answers to the correct question IDs
- For multiple choice questions (radio), provide the exact choice selected
- For checkboxes, provide true/false
- For text fields, provide the user's response as given
- If an answer is unclear or missing, note it in missing_answers
- Set confidence based on how clear and complete the answers were
- Only include question IDs that have actual answers

Return only valid JSON, no additional text or explanation."""