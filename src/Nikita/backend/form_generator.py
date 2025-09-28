#!/usr/bin/env python3
"""
Form generator for converting analysis to form JSON structure
"""

import os
import json
import aiohttp
from prompts import FORM_GENERATION_PROMPT

async def generate_form_from_analysis(analysis_text: str) -> dict:
    """Generate form JSON structure from conversation analysis."""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"error": "OPENAI_API_KEY not found"}
        
        prompt = FORM_GENERATION_PROMPT.format(analysis=analysis_text)
        
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
                    "max_tokens": 1500,
                    "temperature": 0.1
                }
            ) as response:
                if response.ok:
                    data = await response.json()
                    json_response = data["choices"][0]["message"]["content"]
                    
                    # Clean up the response and parse JSON
                    json_response = json_response.strip()
                    if json_response.startswith("```json"):
                        json_response = json_response[7:]
                    if json_response.endswith("```"):
                        json_response = json_response[:-3]
                    json_response = json_response.strip()
                    
                    try:
                        form_data = json.loads(json_response)
                        
                        # Add unique IDs if not present
                        if "questions" in form_data:
                            for i, question in enumerate(form_data["questions"]):
                                if "id" not in question or not question["id"]:
                                    question["id"] = f"q_{i+1}_{hash(question['question']) % 10000}"
                        
                        return form_data
                    except json.JSONDecodeError:
                        return {"error": f"Invalid JSON response: {json_response}"}
                else:
                    return {"error": f"OpenAI API failed ({response.status})"}
    
    except Exception as error:
        return {"error": f"Form generation failed: {str(error)}"}

async def get_latest_analysis() -> str:
    """Get the most recent analysis file content."""
    try:
        import aiofiles
        from pathlib import Path
        
        analysis_dir = Path(__file__).parent / 'analysis'
        if not analysis_dir.exists():
            return None
        
        # Get the most recent analysis file
        analysis_files = sorted(analysis_dir.glob("*_analysis.txt"), 
                               key=lambda x: x.stat().st_mtime, reverse=True)
        
        if not analysis_files:
            return None
        
        latest_file = analysis_files[0]
        async with aiofiles.open(latest_file, 'r', encoding='utf8') as f:
            content = await f.read()
            
        # Extract the analysis content (skip the header)
        lines = content.split('\n')
        analysis_start = 0
        for i, line in enumerate(lines):
            if line.strip() == "1. User's main intent/goal:":
                analysis_start = i
                break
        
        return '\n'.join(lines[analysis_start:]).strip()
        
    except Exception as error:
        return None
