"""
Simple prompts configuration for OpenAI Realtime API and form generation
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
        "interrupt_response": True,
    },
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


# Form generation system prompt: produce strict JSON
FORM_GENERATION_SYSTEM = (
    "You are a form design assistant. Return ONLY strict JSON with keys: title, description, questions. "
    "questions is an array of objects with id (string), question (string), type (one of: text, textarea, email, number, radio, checkbox, select, date), required (boolean). "
    "Do not add commentary."
)


def build_form_generation_user_prompt(current_form_id: str, context: dict | None) -> str:
    parts: list[str] = [
        f"Generate a form for form_id '{current_form_id}'.",
        "Incorporate the following context if present as helpful requirements.",
    ]
    if context:
        parts.append("Context:\n" + repr(context))
    return "\n\n".join(parts)


