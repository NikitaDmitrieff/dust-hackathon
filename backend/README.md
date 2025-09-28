# Scribe Realtime Backend

Python FastAPI backend that proxies to OpenAI Realtime API, manages sessions and discussions, and exposes REST + WebSocket endpoints.

## Quick start

1. Create and populate a `.env` (root or `backend/`):

```
OPENAI_API_KEY=...your key...
OPENAI_REALTIME_MODEL=gpt-4o-realtime-preview
BACKEND_PORT=8001
```

2. Start the server:

```
python backend/start.py
```

Server runs on `http://localhost:8001` by default.

## Endpoints

- GET `/health`
- POST `/api/session`
- POST `/api/discussions/start`
- POST `/api/discussions/{sessionId}/save`
- GET `/api/discussions`
- GET `/api/discussions/{filename}/content`
- POST `/api/discussions/test`
- POST `/api/forms/assist`
- WS `/ws`

`/ws` proxies to OpenAI Realtime when `OPENAI_API_KEY` is set; otherwise it echos.
