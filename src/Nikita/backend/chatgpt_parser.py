#!/usr/bin/env python3
"""
Minimal ChatGPT-4o parser for conversation transcripts
"""

import os
import aiohttp
from prompts import TRANSCRIPT_ANALYSIS_PROMPT

async def parse_transcript_with_chatgpt(transcript_text: str) -> str:
    """Parse transcript using ChatGPT-4o to extract user intent."""
    print(f"\n🤖 PARSING TRANSCRIPT WITH CHATGPT:")
    print(f"   Transcript length: {len(transcript_text)} characters")
    print(f"   Transcript preview: {transcript_text[:200]}...")
    
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print(f"   ❌ OPENAI_API_KEY NOT FOUND")
            return "Error: OPENAI_API_KEY not found"
        
        print(f"   ✅ OPENAI_API_KEY FOUND")
        prompt = TRANSCRIPT_ANALYSIS_PROMPT.format(transcript=transcript_text)
        print(f"   📝 PROMPT CREATED: {len(prompt)} characters")
        
        print(f"   🚀 CALLING OPENAI API FOR TRANSCRIPT ANALYSIS...")
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
                print(f"   📨 OPENAI RESPONSE STATUS: {response.status}")
                if response.ok:
                    data = await response.json()
                    analysis_result = data["choices"][0]["message"]["content"]
                    print(f"   ✅ ANALYSIS RECEIVED: {len(analysis_result)} characters")
                    print(f"   🔍 ANALYSIS PREVIEW: {analysis_result[:200]}...")
                    return analysis_result
                else:
                    error_text = await response.text()
                    print(f"   ❌ OPENAI API FAILED: {response.status} - {error_text}")
                    return f"Error: ChatGPT API failed ({response.status}): {error_text}"
    
    except Exception as error:
        print(f"   ❌ TRANSCRIPT PARSING EXCEPTION: {error}")
        import traceback
        traceback.print_exc()
        return f"Error: {str(error)}"
