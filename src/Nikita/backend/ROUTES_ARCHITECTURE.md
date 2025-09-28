Backend API Routes Architecture: Speak Button ➜ JSON

This document describes only the backend API routes and real-time flow from when a user clicks a Speak button to when JSON is returned.

## Sequence Overview

1) Frontend requests an ephemeral session token

   - Route: `POST /api/session`
   - Purpose: Create an ephemeral OpenAI Realtime session using the server-side `OPENAI_API_KEY`.
   - Returns: JSON containing a short-lived token/secret used to connect via WebSocket.

2) Frontend opens WebSocket to backend and authenticates

   - Route: `WebSocket /ws`
   - Client sends:
     ```json
     { "type": "connect", "ephemeralToken": "<token-from-/api/session>" }
     ```
   - Backend action:
     - Establishes upstream WS to OpenAI Realtime with the ephemeral token
     - Sends a `session.update` upstream with backend defaults (see `prompts.py`)
     - Replies to client:
       ```json
       { "type": "connected" }
       ```

3) Audio and control streaming (bidirectional)

   - Client ➜ Backend: audio bytes (PCM16) and JSON controls (except `session.update`, which is blocked)
   - Backend ➜ OpenAI: forwards the same frames/messages
   - OpenAI ➜ Backend ➜ Client: JSON events (transcripts, responses, tool calls) and optional audio bytes

4) Client receives JSON responses

   - Typical forwarded JSON (example):
     ```json
     {
       "type": "response",
       "output": [
         { "type": "transcript", "text": "Your transcribed speech..." },
         { "type": "message", "role": "assistant", "content": "Answer..." }
       ]
     }
     ```

## HTTP Endpoints

- `POST /api/session`
  - Purpose: Create ephemeral OpenAI Realtime session
  - Response (shape may vary by OpenAI):
    ```json
    {
      "id": "sess_...",
      "client_secret": { "value": "ephemeral_token_...", "expires_at": 1730000000 },
      "model": "gpt-realtime-2025-08-28",
      "voice": "alloy"
    }
    ```

- `GET /api/session/config`
  - Purpose: Read-only view of backend session defaults applied on connect
  - Response:
    ```json
    {
      "sessionConfig": { "instructions": "...", "voice": "alloy", "input_audio_format": "pcm16", "output_audio_format": "pcm16", "input_audio_transcription": { "model": "whisper-1" }, "turn_detection": { "type": "server_vad", "create_response": true, "interrupt_response": true } },
      "model": "gpt-realtime-2025-08-28",
      "voice": "alloy",
      "instructions": "..."
    }
    ```

- `GET /health`
  - Purpose: Health check
  - Response:
    ```json
    { "status": "ok", "service": "openai-realtime-proxy" }
    ```

## WebSocket Endpoint

- `WebSocket /ws`

  - Connect handshake (client ➜ backend):
    ```json
    { "type": "connect", "ephemeralToken": "ephemeral_token_..." }
    ```

  - Backend behavior:
    - Opens upstream WS to OpenAI using the token
    - Sends `session.update` upstream with `DEFAULT_SESSION_CONFIG` (from `prompts.py`)
    - Sends back:
      ```json
      { "type": "connected" }
      ```

  - Streaming rules:
    - Client ➜ Backend: audio bytes and JSON controls
    - Backend blocks `session.update` from client (configuration is server-owned)
    - Backend forwards other JSON frames to OpenAI
    - Backend forwards OpenAI JSON/bytes to client unchanged

  - Error format (examples):
    ```json
    { "type": "error", "error": "Invalid JSON message" }
    ```
    ```json
    { "type": "error", "error": "<OpenAI connection error...>" }
    ```

## File Map (for reference)

- `server.py`
  - Registers routes:
    - `GET /health`
    - `POST /api/session`
    - `GET /api/session/config`
    - `WebSocket /ws`

- `api_routes.py`
  - `health_check()`
  - `create_session()`
  - `get_session_config()`

- `websocket_handler.py`
  - `establish_openai_connection()`
  - `listen_to_openai()` and forwarding logic
  - Blocks client-side `session.update`

- `prompts.py`
  - `DEFAULT_SESSION_CONFIG`, `DEFAULT_VOICE`, `DEFAULT_INSTRUCTIONS`


