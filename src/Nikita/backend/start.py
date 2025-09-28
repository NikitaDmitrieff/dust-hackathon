#!/usr/bin/env python3
"""
Startup script for the OpenAI Realtime Proxy Server
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Install Python requirements"""
    requirements_file = Path(__file__).parent / "requirements.txt"
    if requirements_file.exists():
        print("Installing Python requirements...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", str(requirements_file)])
    else:
        print("No requirements.txt found, skipping pip install")

def start_server():
    """Start the FastAPI server"""
    print("Starting Python FastAPI server...")
    os.chdir(Path(__file__).parent)
    subprocess.call([sys.executable, "server.py"])

if __name__ == "__main__":
    try:
        install_requirements()
        start_server()
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
