#!/usr/bin/env python3
"""
ChatGPT-4o analysis of conversation transcripts
"""

import os
import json
import aiohttp
from prompts import TRANSCRIPT_ANALYSIS_PROMPT


async def parse_transcript_with_chatgpt(transcript: str) -> str:
    """
    Send transcript to ChatGPT-4o for analysis of user intent
    """
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        return "ERROR: OpenAI API key not configured"
    
    try:
        async with aiohttp.ClientSession() as session:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {openai_api_key}",
                "Content-Type": "application/json",
            }
            
            # Use the analysis prompt from prompts.py
            system_prompt = "You are an expert at analyzing conversations to understand user intentions and requirements for form creation."
            user_prompt = TRANSCRIPT_ANALYSIS_PROMPT.format(transcript=transcript)
            
            payload = {
                "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 1000,
            }
            
            async with session.post(url, headers=headers, json=payload) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    analysis = data["choices"][0]["message"]["content"]
                    return analysis
                else:
                    error_text = await resp.text()
                    return f"ERROR: OpenAI API call failed with status {resp.status}: {error_text}"
    
    except Exception as e:
        return f"ERROR: Failed to analyze transcript: {str(e)}"
