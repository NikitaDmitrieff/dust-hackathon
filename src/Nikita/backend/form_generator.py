#!/usr/bin/env python3
"""
Form generator for converting analysis to form JSON structure
"""

import os
import json
import aiohttp
from datetime import datetime
from prompts import FORM_GENERATION_PROMPT

async def generate_form_from_analysis(analysis_text: str) -> dict:
    """Generate form JSON structure from conversation analysis."""
    print(f"\n🤖 GENERATING FORM FROM ANALYSIS:")
    print(f"   Analysis length: {len(analysis_text)} characters")
    print(f"   Analysis preview: {analysis_text[:100]}...")
    
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print(f"   ❌ OPENAI_API_KEY NOT FOUND")
            return {"error": "OPENAI_API_KEY not found"}
        
        print(f"   ✅ OPENAI_API_KEY FOUND")
        prompt = FORM_GENERATION_PROMPT.format(analysis=analysis_text)
        print(f"   📝 PROMPT CREATED: {len(prompt)} characters")
        
        print(f"   🚀 CALLING OPENAI API...")
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
                print(f"   📨 OPENAI RESPONSE STATUS: {response.status}")
                if response.ok:
                    data = await response.json()
                    json_response = data["choices"][0]["message"]["content"]
                    print(f"   ✅ OPENAI RESPONSE RECEIVED: {len(json_response)} characters")
                    print(f"   🔍 RESPONSE PREVIEW: {json_response[:200]}...")
                    
                    # Clean up the response and parse JSON
                    json_response = json_response.strip()
                    if json_response.startswith("```json"):
                        json_response = json_response[7:]
                    if json_response.endswith("```"):
                        json_response = json_response[:-3]
                    json_response = json_response.strip()
                    
                    try:
                        print(f"   🔄 PARSING JSON RESPONSE...")
                        form_data = json.loads(json_response)
                        print(f"   ✅ JSON PARSED SUCCESSFULLY")
                        print(f"   📝 FORM DATA: {form_data}")
                        
                        # Add unique IDs if not present
                        if "questions" in form_data:
                            print(f"   🏷️ ADDING UNIQUE IDs TO {len(form_data['questions'])} QUESTIONS")
                            for i, question in enumerate(form_data["questions"]):
                                if "id" not in question or not question["id"]:
                                    question["id"] = f"q_{i+1}_{hash(question['question']) % 10000}"
                                    print(f"     Question {i+1} ID: {question['id']}")
                        
                        print(f"   ✅ FORM GENERATION COMPLETED")
                        return form_data
                    except json.JSONDecodeError as e:
                        print(f"   ❌ JSON DECODE ERROR: {e}")
                        print(f"   🔍 RAW RESPONSE: {json_response}")
                        return {"error": f"Invalid JSON response: {json_response}"}
                else:
                    error_text = await response.text()
                    print(f"   ❌ OPENAI API FAILED: {response.status} - {error_text}")
                    return {"error": f"OpenAI API failed ({response.status}): {error_text}"}
    
    except Exception as error:
        print(f"   ❌ FORM GENERATION EXCEPTION: {error}")
        import traceback
        traceback.print_exc()
        return {"error": f"Form generation failed: {str(error)}"}

async def get_latest_analysis() -> str:
    """Get the most recent analysis file content."""
    print(f"\n🔍 SEARCHING FOR LATEST ANALYSIS:")
    
    try:
        import aiofiles
        from pathlib import Path
        
        analysis_dir = Path(__file__).parent / 'analysis'
        print(f"   Analysis directory: {analysis_dir}")
        print(f"   Directory exists: {analysis_dir.exists()}")
        
        if not analysis_dir.exists():
            print(f"   ❌ ANALYSIS DIRECTORY DOES NOT EXIST")
            return None
        
        # Get the most recent analysis file
        print(f"   🔍 SEARCHING FOR *_analysis.txt FILES...")
        analysis_files = sorted(analysis_dir.glob("*_analysis.txt"), 
                               key=lambda x: x.stat().st_mtime, reverse=True)
        
        print(f"   Found {len(analysis_files)} analysis files:")
        for i, file in enumerate(analysis_files[:5]):  # Show first 5
            print(f"     {i+1}. {file.name} (modified: {datetime.fromtimestamp(file.stat().st_mtime)})")
        
        if not analysis_files:
            print(f"   ❌ NO ANALYSIS FILES FOUND")
            return None
        
        latest_file = analysis_files[0]
        print(f"   ✅ USING LATEST FILE: {latest_file.name}")
        
        async with aiofiles.open(latest_file, 'r', encoding='utf8') as f:
            content = await f.read()
        
        print(f"   ✅ FILE READ: {len(content)} characters")
        
        # Extract the analysis content (skip the header)
        lines = content.split('\n')
        analysis_start = 0
        for i, line in enumerate(lines):
            if line.strip() == "1. User's main intent/goal:":
                analysis_start = i
                break
        
        extracted_content = '\n'.join(lines[analysis_start:]).strip()
        print(f"   ✅ EXTRACTED ANALYSIS: {len(extracted_content)} characters")
        print(f"   🔍 PREVIEW: {extracted_content[:200]}...")
        
        return extracted_content
        
    except Exception as error:
        print(f"   ❌ ERROR READING ANALYSIS: {error}")
        import traceback
        traceback.print_exc()
        return None
