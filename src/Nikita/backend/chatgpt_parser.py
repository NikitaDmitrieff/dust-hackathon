#!/usr/bin/env python3
"""
Minimal ChatGPT-4o parser for conversation transcripts
"""

import os
import aiohttp
from prompts import TRANSCRIPT_ANALYSIS_PROMPT

async def parse_transcript_with_chatgpt(transcript_text: str) -> str:
    """Parse transcript using ChatGPT-4o to extract user intent."""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return "Error: OPENAI_API_KEY not found"
        
        prompt = TRANSCRIPT_ANALYSIS_PROMPT.format(transcript=transcript_text)
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 300,
                    "temperature": 0
                }
            ) as response:
                if response.ok:
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    return f"Error: ChatGPT API failed ({response.status})"
    
    except Exception as error:
        return f"Error: {str(error)}"
