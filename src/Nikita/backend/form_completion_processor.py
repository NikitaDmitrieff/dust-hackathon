#!/usr/bin/env python3
"""
Form completion processor for converting voice conversation transcripts to form answers
"""

import os
import json
import aiohttp
from prompts import FORM_COMPLETION_ANALYSIS_PROMPT, FORM_ANSWERS_GENERATION_PROMPT
from typing import Dict, List, Any

async def generate_answers_from_analysis(questions: List[Dict], analysis_text: str) -> Dict[str, Any]:
    """Generate structured form answers from conversation analysis."""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"error": "OPENAI_API_KEY not found"}
        
        # Format questions for the prompt
        questions_text = "\n".join([
            f"Question ID: {q.get('question_id', q.get('id', 'unknown'))} | Question: {q.get('question', '')} | Type: {q.get('type_answer', q.get('type', 'text'))}"
            for q in questions
        ])
        
        prompt = FORM_ANSWERS_GENERATION_PROMPT.format(
            questions=questions_text,
            analysis=analysis_text
        )
        
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
                        answers_data = json.loads(json_response)
                        return answers_data
                    except json.JSONDecodeError:
                        return {"error": f"Invalid JSON response: {json_response}"}
                else:
                    return {"error": f"OpenAI API failed ({response.status})"}
    
    except Exception as error:
        return {"error": f"Answer generation failed: {str(error)}"}

async def analyze_form_completion_transcript(questions: List[Dict], transcript: str) -> str:
    """Analyze a form completion conversation transcript."""
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return "Error: OPENAI_API_KEY not found"
        
        # Format questions for the prompt
        questions_text = "\n".join([
            f"Question ID: {q.get('question_id', q.get('id', 'unknown'))} | Question: {q.get('question', '')} | Type: {q.get('type_answer', q.get('type', 'text'))}"
            for q in questions
        ])
        
        prompt = FORM_COMPLETION_ANALYSIS_PROMPT.format(
            questions=questions_text,
            transcript=transcript
        )
        
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
                    "max_tokens": 1000,
                    "temperature": 0.1
                }
            ) as response:
                if response.ok:
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    return f"Error: OpenAI API failed ({response.status})"
    
    except Exception as error:
        return f"Error: Analysis failed: {str(error)}"

async def get_latest_form_completion_analysis() -> str:
    """Get the most recent form completion analysis file content."""
    try:
        import aiofiles
        from pathlib import Path
        
        analysis_dir = Path(__file__).parent / 'analysis'
        if not analysis_dir.exists():
            return None
        
        # Get the most recent form completion analysis file
        analysis_files = sorted(analysis_dir.glob("*_form_completion_analysis.txt"), 
                               key=lambda x: x.stat().st_mtime, reverse=True)
        
        if not analysis_files:
            # Fallback to regular analysis files
            analysis_files = sorted(analysis_dir.glob("*_analysis.txt"), 
                                   key=lambda x: x.stat().st_mtime, reverse=True)
        
        if not analysis_files:
            return None
        
        latest_file = analysis_files[0]
        async with aiofiles.open(latest_file, 'r', encoding='utf8') as f:
            content = await f.read()
            
        return content.strip()
        
    except Exception as error:
        print(f"Error reading analysis file: {error}")
        return None

async def process_form_completion_session(session_id: str, questions: List[Dict]) -> Dict[str, Any]:
    """Process a completed form completion session and extract answers."""
    try:
        from conversation_logger import ConversationLogger
        
        print(f"Processing session: {session_id}")
        print(f"Questions received: {len(questions)}")
        
        logger = ConversationLogger()
        
        # Get the conversation transcript
        transcript = await logger.get_session_transcript(session_id, mode='form_completion')
        print(f"Transcript found: {bool(transcript)}")
        if transcript:
            print(f"Transcript length: {len(transcript)}")
        
        if not transcript:
            return {"error": f"No transcript found for session {session_id}"}
        
        # Analyze the transcript
        print("Starting transcript analysis...")
        analysis = await analyze_form_completion_transcript(questions, transcript)
        print(f"Analysis result: {analysis[:100] if analysis else 'None'}...")
        
        if analysis.startswith("Error:"):
            return {"error": analysis}
        
        # Save the analysis
        await logger.save_form_completion_analysis(session_id, analysis)
        
        # Generate structured answers from the analysis
        print("Generating structured answers...")
        answers_data = await generate_answers_from_analysis(questions, analysis)
        print(f"Generated answers: {answers_data}")
        
        return answers_data
        
    except Exception as error:
        print(f"Exception in process_form_completion_session: {str(error)}")
        import traceback
        traceback.print_exc()
        return {"error": f"Session processing failed: {str(error)}"}
