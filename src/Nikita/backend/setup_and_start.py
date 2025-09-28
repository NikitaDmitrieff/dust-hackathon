#!/usr/bin/env python3
"""
Setup and start script for the Nikita Voice Assistant backend
"""

import os
import subprocess
import sys
from pathlib import Path

def check_dependencies():
    """Check if all required Python packages are installed"""
    try:
        import fastapi
        import uvicorn
        import aiohttp
        import aiofiles
        from dotenv import load_dotenv
        print("✅ All Python dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        return False

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing Python dependencies...")
    
    requirements = [
        "fastapi",
        "uvicorn",
        "aiohttp",
        "aiofiles", 
        "python-dotenv",
        "websockets"
    ]
    
    for package in requirements:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ Installed {package}")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to install {package}")
            return False
    
    return True

def check_env_file():
    """Check if .env file exists with required variables"""
    env_file = Path(__file__).parent / '.env'
    
    if not env_file.exists():
        print("⚠️  .env file not found. Creating template...")
        with open(env_file, 'w') as f:
            f.write("OPENAI_API_KEY=your_openai_api_key_here\n")
            f.write("PORT=3001\n")
        print(f"📝 Created .env file at {env_file}")
        print("🔑 Please edit the .env file and add your OpenAI API key")
        return False
    
    # Check if OpenAI API key is set
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        print("🔑 Please set your OPENAI_API_KEY in the .env file")
        return False
    
    print("✅ Environment configuration is ready")
    return True

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting Nikita Voice Assistant Backend...")
    print("📡 Server will be available at:")
    print("   - WebSocket: ws://localhost:3001/ws")
    print("   - API: http://localhost:3001/api/")
    print("   - Health: http://localhost:3001/health")
    print("=" * 60)
    
    try:
        # Change to the directory containing server.py
        os.chdir(Path(__file__).parent)
        
        # Start the server
        subprocess.run([sys.executable, "server.py"], check=True)
    except subprocess.CalledProcessError:
        print("❌ Failed to start server")
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")

def main():
    """Main setup and start function"""
    print("=" * 60)
    print("🎤 Nikita Voice Assistant Backend Setup")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        print("\n📦 Installing missing dependencies...")
        if not install_dependencies():
            print("❌ Failed to install dependencies. Please install manually.")
            return
    
    # Check environment configuration
    if not check_env_file():
        print("❌ Please configure your environment and run again.")
        return
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main()
