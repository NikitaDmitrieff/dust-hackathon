#!/usr/bin/env python3
"""
API routes for OpenAI Realtime API proxy
"""

import os
import aiohttp
from fastapi import HTTPException
from prompts import DEFAULT_SESSION_CONFIG, DEFAULT_INSTRUCTIONS, DEFAULT_VOICE

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_REALTIME_MODEL = "gpt-realtime-2025-08-28"

async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "openai-realtime-proxy"}

async def create_session():
    """Create an ephemeral OpenAI Realtime API session"""
    try:
        
        if not OPENAI_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail='OPENAI_API_KEY environment variable is required'
            )

        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.openai.com/v1/realtime/sessions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": OPENAI_REALTIME_MODEL, 
                    "voice": DEFAULT_VOICE
                }
            ) as response:
                if not response.ok:
                    error_text = await response.text()
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"OpenAI API error: {response.status} - {error_text}"
                    )

                session_data = await response.json()
                return session_data

    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create session: {str(error)}"
        )

async def get_session_config():
    """Get the current session configuration"""
    try:
        return {
            "sessionConfig": DEFAULT_SESSION_CONFIG.copy(),
            "model": OPENAI_REALTIME_MODEL,
            "voice": DEFAULT_VOICE,
            "instructions": DEFAULT_INSTRUCTIONS
        }
    except Exception as error:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to get session config: {str(error)}"
        )

async def generate_form_from_latest_session():
    """Generate form JSON from the latest conversation analysis"""
    try:
        from form_generator import get_latest_analysis, generate_form_from_analysis
        
        # Get the latest analysis
        analysis = await get_latest_analysis()
        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="No conversation analysis found"
            )
        
        # Generate form from analysis
        form_data = await generate_form_from_analysis(analysis)
        
        if "error" in form_data:
            raise HTTPException(
                status_code=500,
                detail=f"Form generation error: {form_data['error']}"
            )
        
        return form_data
        
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate form: {str(error)}"
        )

async def generate_form_answers_from_session(session_id: str, questions: list):
    """Generate form answers from a specific conversation session"""
    try:
        from form_completion_processor import process_form_completion_session
        
        # Process the session to extract answers
        result = await process_form_completion_session(session_id, questions)
        
        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=f"Form completion error: {result['error']}"
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate form answers: {str(error)}"
        )
