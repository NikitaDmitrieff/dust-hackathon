# OpenAI Realtime Proxy Server

A Python-based WebSocket proxy server for OpenAI's Realtime API, providing conversation logging, session management, and real-time audio streaming capabilities. Built with FastAPI and asyncio for high performance.

## Features

- ✅ WebSocket proxy to OpenAI Realtime API
- ✅ Conversation logging and auto-save
- ✅ Session management
- ✅ REST API endpoints for discussion management
- ✅ Health check endpoint
- ✅ CORS support
- ✅ Binary audio data handling
- ✅ Automatic conversation transcription

## Requirements

- Python 3.8+
- OpenAI API Key

## Installation & Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   Create a `.env` file or set:
   ```bash
   export OPENAI_API_KEY="your-openai-api-key"
   export PORT=3001  # Optional, defaults to 3001
   ```

## Running the Server

### Option 1: Using the startup script (recommended)
```bash
python3 start.py
```

### Option 2: Direct execution
```bash
python3 server.py
```


## API Endpoints

Available API endpoints:

- `GET /health` - Health check
- `POST /api/session` - Create OpenAI session
- `POST /api/discussions/start` - Start new discussion
- `POST /api/discussions/{sessionId}/save` - Save discussion
- `GET /api/discussions` - List all discussions
- `GET /api/discussions/{filename}/content` - Get discussion content
- `POST /api/discussions/test` - Create test discussion
- `WebSocket /ws` - Main WebSocket proxy endpoint

## Technology Stack

- **Framework**: FastAPI for high-performance async web framework
- **WebSocket**: websockets + FastAPI WebSocket for real-time communication
- **HTTP Client**: aiohttp for async HTTP requests to OpenAI API
- **File I/O**: aiofiles for async file operations
- **Environment**: python-dotenv for environment variable management
- **Concurrency**: asyncio for concurrent request handling
- **Type Safety**: Comprehensive type hints for better code clarity

## File Structure

```
backend/
├── server.py              # Main FastAPI application
├── start.py               # Startup script with dependency installation
├── requirements.txt       # Python dependencies
├── discussions/           # Conversation logs directory
└── README.md              # This documentation
```

## Architecture

The server provides a clean separation of concerns:

- **WebSocket Proxy**: Handles real-time bidirectional communication with OpenAI
- **Session Management**: Tracks conversation sessions with unique identifiers
- **Conversation Logging**: Automatically saves conversations with proper formatting
- **REST API**: Provides endpoints for session and discussion management
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## Troubleshooting

### Common Issues

1. **Missing Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Port already in use**
   ```bash
   export PORT=3002  # Use different port
   python3 server.py
   ```

3. **OpenAI API Key not found**
   ```bash
   export OPENAI_API_KEY="your-key-here"
   ```

4. **WebSocket connection issues**
   - Check firewall settings
   - Verify OpenAI API key permissions
   - Check network connectivity

## Development

For development with auto-reload:
```bash
python3 server.py
```

The server uses uvicorn with reload=True for automatic reloading on file changes.

## Logging

The Python version uses structured logging with timestamps. Logs include:
- WebSocket connection events
- OpenAI API interactions
- Conversation logging
- Error tracking
- Session management

## Performance

The Python version should have similar performance characteristics to the Node.js version for this I/O-bound application. Both versions handle:
- Concurrent WebSocket connections
- Real-time audio streaming
- File I/O for conversation logging
- HTTP API requests
