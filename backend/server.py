import os
import json
import uuid
import asyncio
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiofiles
import aiohttp
import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from prompts import FORM_GENERATION_SYSTEM, build_form_generation_user_prompt
from conversation_logger import ConversationLogger


BASE_DIR = Path(__file__).resolve().parent
DISCUSSIONS_DIR = BASE_DIR / "discussions"
ANALYSIS_DIR = BASE_DIR / "analysis"
DISCUSSIONS_DIR.mkdir(parents=True, exist_ok=True)
ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)


class SessionCreateRequest(BaseModel):
    model: Optional[str] = None


class SessionCreateResponse(BaseModel):
    session_id: str
    model: str


class DiscussionStartRequest(BaseModel):
    session_id: Optional[str] = None
    title: Optional[str] = None


class DiscussionSaveRequest(BaseModel):
    content: Dict[str, Any]


class FormAssistRequest(BaseModel):
    current_form_id: str = Field(..., description="Current form identifier")
    context: Optional[Dict[str, Any]] = None


class FormQuestion(BaseModel):
    id: str
    question: str
    type: str
    required: bool = False


class FormAssistResponse(BaseModel):
    title: str
    description: str
    questions: List[FormQuestion]


app = FastAPI(title="Scribe Realtime Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global conversation logger
conversation_logger = ConversationLogger()


@app.get("/health")
async def health() -> Dict[str, Any]:
    return {"status": "ok"}


@app.post("/api/session", response_model=SessionCreateResponse)
async def create_session(req: SessionCreateRequest) -> SessionCreateResponse:
    # Try to create an OpenAI Realtime session (ephemeral). If it fails, fall back to local id
    model = req.model or os.getenv("OPENAI_REALTIME_MODEL", "gpt-4o-realtime-preview")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        try:
            async with aiohttp.ClientSession() as session:
                url = "https://api.openai.com/v1/realtime/sessions"
                headers = {
                    "Authorization": f"Bearer {openai_api_key}",
                    "OpenAI-Beta": "realtime=v1",
                    "Content-Type": "application/json",
                }
                payload = {"model": model}
                async with session.post(url, headers=headers, json=payload) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        # Use upstream id if available
                        return SessionCreateResponse(session_id=data.get("id", str(uuid.uuid4())), model=model)
        except Exception:
            # Silent fallback
            pass
    return SessionCreateResponse(session_id=str(uuid.uuid4()), model=model)


@app.post("/api/discussions/start")
async def start_discussion(req: DiscussionStartRequest) -> Dict[str, Any]:
    discussion_id = str(uuid.uuid4())
    filename = f"{discussion_id}.jsonl"
    filepath = DISCUSSIONS_DIR / filename
    start_event = {
        "type": "start",
        "discussion_id": discussion_id,
        "session_id": req.session_id,
        "title": req.title,
    }
    async with aiofiles.open(filepath, "a") as f:
        await f.write(json.dumps(start_event) + "\n")
    return {"discussion_id": discussion_id, "filename": filename}


@app.post("/api/discussions/{session_id}/save")
async def save_discussion(session_id: str, req: DiscussionSaveRequest) -> Dict[str, Any]:
    # Save into the latest file for this session_id or create one
    # For simplicity, create a file named by session id if not exists
    filename = f"{session_id}.jsonl"
    filepath = DISCUSSIONS_DIR / filename
    event = {"type": "save", "session_id": session_id, "content": req.content}
    async with aiofiles.open(filepath, "a") as f:
        await f.write(json.dumps(event) + "\n")
    return {"status": "saved", "filename": filename}


@app.get("/api/discussions")
async def list_discussions() -> Dict[str, Any]:
    files = sorted([p.name for p in DISCUSSIONS_DIR.glob("*.jsonl")])
    return {"files": files}


@app.get("/api/discussions/{filename}/content")
async def get_discussion_content(filename: str) -> Dict[str, Any]:
    filepath = DISCUSSIONS_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Discussion not found")
    lines: List[str] = []
    async with aiofiles.open(filepath, "r") as f:
        async for line in f:
            lines.append(line.rstrip("\n"))
    return {"lines": lines}


@app.post("/api/discussions/test")
async def create_test_discussion() -> Dict[str, Any]:
    discussion_id = str(uuid.uuid4())
    filename = f"{discussion_id}.jsonl"
    filepath = DISCUSSIONS_DIR / filename
    events = [
        {"type": "start", "discussion_id": discussion_id, "title": "Test Discussion"},
        {"type": "message", "role": "user", "content": "Hello"},
        {"type": "message", "role": "assistant", "content": "Hi!"},
    ]
    async with aiofiles.open(filepath, "a") as f:
        for e in events:
            await f.write(json.dumps(e) + "\n")
    return {"discussion_id": discussion_id, "filename": filename}


@app.post("/api/forms/assist", response_model=FormAssistResponse)
async def forms_assist(req: FormAssistRequest) -> FormAssistResponse:
    # If API key is present, call OpenAI for JSON; otherwise return error message
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        # Return error message if no OpenAI API key
        questions: List[FormQuestion] = [
            FormQuestion(id=str(uuid.uuid4()), question="DEBUG: OpenAI API key not configured", type="text", required=False),
        ]
        return FormAssistResponse(title="DEBUG: No OpenAI API Key", description="DEBUG: OpenAI API key is missing from environment variables", questions=questions)
    
    try:
        async with aiohttp.ClientSession() as session:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {openai_api_key}",
                "Content-Type": "application/json",
            }
            system_prompt = FORM_GENERATION_SYSTEM
            user_prompt = build_form_generation_user_prompt(req.current_form_id, req.context)
            payload = {
                "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
            }
            async with session.post(url, headers=headers, json=payload) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    # Validate minimal shape; coerce to pydantic
                    title = parsed.get("title") or f"AI Generated Form for {req.current_form_id}"
                    description = parsed.get("description") or "Generated by AI."
                    raw_questions = parsed.get("questions") or []
                    questions = [
                        FormQuestion(
                            id=q.get("id") or str(uuid.uuid4()),
                            question=q.get("question") or "Untitled question",
                            type=q.get("type") or "text",
                            required=bool(q.get("required", False)),
                        )
                        for q in raw_questions
                    ]
                    return FormAssistResponse(title=title, description=description, questions=questions)
    except Exception:
        # If OpenAI call fails, also return error message
        pass

    # Fallback if OpenAI call fails
    questions: List[FormQuestion] = [
        FormQuestion(id=str(uuid.uuid4()), question="Erreur OpenAI", type="text", required=False),
    ]
    return FormAssistResponse(title="Erreur OpenAI", description="Échec de l'appel à OpenAI", questions=questions)


@app.post("/api/forms/from-conversation/{session_id}", response_model=FormAssistResponse)
async def forms_from_conversation(session_id: str) -> FormAssistResponse:
    """Generate a form based on conversation analysis"""
    
    # Check if analysis file exists
    analysis_path = ANALYSIS_DIR / f"{session_id}_analysis.txt"
    if not analysis_path.exists():
        questions: List[FormQuestion] = [
            FormQuestion(id=str(uuid.uuid4()), question="ERROR: Aucune analyse trouvée pour cette conversation", type="text", required=False),
        ]
        return FormAssistResponse(title="Erreur", description="Aucune analyse de conversation trouvée", questions=questions)
    
    # Read analysis
    try:
        async with aiofiles.open(analysis_path, "r", encoding="utf8") as f:
            analysis_content = await f.read()
    except Exception:
        questions: List[FormQuestion] = [
            FormQuestion(id=str(uuid.uuid4()), question="ERROR: Impossible de lire l'analyse", type="text", required=False),
        ]
        return FormAssistResponse(title="Erreur", description="Impossible de lire l'analyse de conversation", questions=questions)
    
    # Use OpenAI to generate form based on analysis
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        questions: List[FormQuestion] = [
            FormQuestion(id=str(uuid.uuid4()), question="DEBUG: OpenAI API key not configured", type="text", required=False),
        ]
        return FormAssistResponse(title="DEBUG: No OpenAI API Key", description="DEBUG: OpenAI API key is missing from environment variables", questions=questions)
    
    try:
        async with aiohttp.ClientSession() as session:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {openai_api_key}",
                "Content-Type": "application/json",
            }
            system_prompt = FORM_GENERATION_SYSTEM
            user_prompt = f"Based on this conversation analysis, generate an appropriate form:\n\n{analysis_content}"
            payload = {
                "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
            }
            async with session.post(url, headers=headers, json=payload) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    # Validate minimal shape; coerce to pydantic
                    title = parsed.get("title") or f"Formulaire basé sur conversation {session_id}"
                    description = parsed.get("description") or "Généré à partir de l'analyse de conversation vocale."
                    raw_questions = parsed.get("questions") or []
                    questions = [
                        FormQuestion(
                            id=q.get("id") or str(uuid.uuid4()),
                            question=q.get("question") or "Question sans titre",
                            type=q.get("type") or "text",
                            required=bool(q.get("required", False)),
                        )
                        for q in raw_questions
                    ]
                    return FormAssistResponse(title=title, description=description, questions=questions)
    except Exception:
        pass
    
    # Fallback if OpenAI call fails
    questions: List[FormQuestion] = [
        FormQuestion(id=str(uuid.uuid4()), question="Erreur OpenAI", type="text", required=False),
    ]
    return FormAssistResponse(title="Erreur OpenAI", description="Échec de l'appel à OpenAI pour générer le formulaire", questions=questions)


@app.get("/api/conversations/{session_id}/analysis")
async def get_conversation_analysis(session_id: str) -> Dict[str, Any]:
    """Get the analysis of a conversation"""
    analysis_path = ANALYSIS_DIR / f"{session_id}_analysis.txt"
    if not analysis_path.exists():
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    async with aiofiles.open(analysis_path, "r", encoding="utf8") as f:
        content = await f.read()
    
    return {"session_id": session_id, "analysis": content}


@app.get("/api/conversations")
async def list_conversations() -> Dict[str, Any]:
    """List all conversation files and their analyses"""
    
    # Import here to access ANALYSIS_DIR
    from conversation_logger import ANALYSIS_DIR
    
    conversation_files = sorted([p.name for p in DISCUSSIONS_DIR.glob("conversation_*.txt")])
    analysis_files = sorted([p.name for p in ANALYSIS_DIR.glob("*_analysis.txt")])
    
    return {
        "conversations": conversation_files,
        "analyses": analysis_files
    }


async def _openai_ws_connect(model: str) -> websockets.WebSocketClientProtocol:
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    url = f"wss://api.openai.com/v1/realtime?model={model}"
    headers = [
        ("Authorization", f"Bearer {openai_api_key}"),
        ("OpenAI-Beta", "realtime=v1"),
    ]
    return await websockets.connect(url, extra_headers=headers, max_size=None)


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(ws: WebSocket, session_id: str) -> None:
    await ws.accept()
    model = os.getenv("OPENAI_REALTIME_MODEL", "gpt-4o-realtime-preview")

    # Start conversation logging
    conversation_logger.start_session(session_id)

    upstream: Optional[websockets.WebSocketClientProtocol] = None
    client_to_openai_task = None
    openai_to_client_task = None

    async def client_to_openai() -> None:
        assert upstream is not None
        while True:
            event = await ws.receive()
            if event["type"] == "websocket.disconnect":
                break
            data_text = event.get("text")
            data_bytes = event.get("bytes")
            if data_text is not None:
                # Log client message
                try:
                    message_data = json.loads(data_text)
                    conversation_logger.log_client_message(session_id, message_data)
                except:
                    pass
                await upstream.send(data_text)
            elif data_bytes is not None:
                await upstream.send(data_bytes)

    async def openai_to_client() -> None:
        assert upstream is not None
        while True:
            data = await upstream.recv()
            if isinstance(data, (bytes, bytearray)):
                await ws.send_bytes(data)
            else:
                # Log OpenAI message
                try:
                    message_data = json.loads(data)
                    conversation_logger.log_openai_message(session_id, message_data)
                except:
                    pass
                await ws.send_text(data)

    try:
        try:
            upstream = await _openai_ws_connect(model)
        except Exception:
            # If we cannot connect upstream, fall back to echo
            upstream = None

        if upstream is None:
            # Echo fallback
            while True:
                event = await ws.receive()
                if event["type"] == "websocket.disconnect":
                    break
                data_text = event.get("text")
                data_bytes = event.get("bytes")
                if data_text is not None:
                    await ws.send_text(json.dumps({"echo": data_text}))
                elif data_bytes is not None:
                    await ws.send_bytes(data_bytes)
            return

        client_to_openai_task = asyncio.create_task(client_to_openai())
        openai_to_client_task = asyncio.create_task(openai_to_client())
        await asyncio.wait({client_to_openai_task, openai_to_client_task}, return_when=asyncio.FIRST_COMPLETED)
    except WebSocketDisconnect:
        pass
    finally:
        # Save conversation when WebSocket disconnects
        await conversation_logger.save_conversation(session_id)
        
        for task in (client_to_openai_task, openai_to_client_task):
            if task is not None:
                task.cancel()
        if upstream is not None:
            try:
                await upstream.close()
            except Exception:
                pass


