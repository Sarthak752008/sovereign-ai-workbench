#!/usr/bin/env python3
"""
Sovereign AI Workbench - Complete Setup & Start Script
Handles: Ollama check, dependencies, backend start, frontend start
"""

import subprocess
import sys
import time
import os
import json
import requests
from pathlib import Path

PROJECT_ROOT = Path(r"C:\Users\sarth\OneDrive\Desktop\sovereign-ai-workbench")
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

def print_header(text):
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60 + "\n")

def print_success(text):
    print(f"✅  {text}")

def print_error(text):
    print(f"❌  {text}")

def print_info(text):
    print(f"ℹ️   {text}")

def check_ollama():
    """Check if Ollama is installed and accessible"""
    print_header("CHECKING OLLAMA")
    
    try:
        result = subprocess.run(["ollama", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print_success(f"Ollama found: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass
    
    print_error("Ollama not found!")
    print_info("Download from: https://ollama.ai")
    return False

def check_ollama_running():
    """Check if Ollama server is running"""
    try:
        response = requests.get("http://127.0.0.1:11434/api/tags", timeout=2)
        if response.status_code == 200:
            models = response.json().get("models", [])
            if models:
                print_success("Ollama is running with models:")
                for m in models:
                    print(f"   - {m['name']}")
                return True
            else:
                print_error("Ollama running but no models found")
                print_info("Pull a model: ollama pull llama2:7b")
                return False
    except:
        print_error("Ollama server not running on 127.0.0.1:11434")
        print_info("Start with: ollama serve")
        return False

def check_python_deps():
    """Check if all Python dependencies are installed"""
    print_header("CHECKING PYTHON DEPENDENCIES")
    
    required = ["fastapi", "uvicorn", "httpx", "pydantic", "pydantic-settings"]
    missing = []
    
    for pkg in required:
        try:
            __import__(pkg.replace("-", "_"))
            print_success(f"{pkg}")
        except ImportError:
            print_error(f"{pkg} - MISSING")
            missing.append(pkg)
    
    if missing:
        print_info(f"Installing missing packages: {', '.join(missing)}")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(BACKEND_DIR / "requirements.txt")])
        return False
    
    return True

def start_backend():
    """Start backend server"""
    print_header("STARTING BACKEND SERVER")
    print_info("Backend will start on: http://localhost:8000")
    print_info("API docs: http://localhost:8000/docs")
    print_info("\nPress Ctrl+C to stop")
    
    os.chdir(BACKEND_DIR)
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000",
            "--reload"
        ])
    except KeyboardInterrupt:
        print_info("\nBackend stopped")

def start_frontend():
    """Start frontend server"""
    print_header("STARTING FRONTEND SERVER")
    print_info("Frontend will start on: http://localhost:3000")
    print_info("\nPress Ctrl+C to stop")
    
    os.chdir(FRONTEND_DIR)
    
    # Check if node_modules exists
    if not (FRONTEND_DIR / "node_modules").exists():
        print_info("Installing npm dependencies...")
        subprocess.run(["npm", "install"], check=False)
    
    try:
        subprocess.run(["npm", "run", "dev"])
    except KeyboardInterrupt:
        print_info("\nFrontend stopped")

def main():
    print_header("SOVEREIGN AI WORKBENCH - SETUP & START")
    
    # 1. Check Ollama
    ollama_installed = check_ollama()
    
    # 2. Check Python dependencies
    deps_ok = check_python_deps()
    if not deps_ok:
        print_info("Retrying dependency check...")
        deps_ok = check_python_deps()
    
    if not deps_ok:
        print_error("Failed to install dependencies. Install manually:")
        print(f"  cd {BACKEND_DIR}")
        print("  pip install -r requirements.txt")
        sys.exit(1)
    
    # 3. Check if Ollama is running
    if ollama_installed:
        if not check_ollama_running():
            print("\n" + "="*60)
            print("⚠️   OLLAMA NOT RUNNING!")
            print("="*60)
            print("\nTo start Ollama:")
            print("  1. Open a new Command Prompt")
            print("  2. Run: ollama serve")
            print("  3. In another Command Prompt, pull a model:")
            print("     ollama pull llama2:7b")
            print("\nThen run this script again.\n")
            sys.exit(1)
    else:
        print("\n" + "="*60)
        print("⚠️   OLLAMA NOT INSTALLED!")
        print("="*60)
        print("\nSetup steps:")
        print("  1. Download: https://ollama.ai")
        print("  2. Install and restart")
        print("  3. Run: ollama pull llama2:7b")
        print("  4. Run: ollama serve")
        print("  5. Run this script again\n")
        sys.exit(1)
    
    # 4. Ask user what to start
    print_header("WHAT DO YOU WANT TO START?")
    print("1. Backend only")
    print("2. Frontend only")
    print("3. Both (recommended)")
    print("4. Exit")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    if choice == "1":
        start_backend()
    elif choice == "2":
        start_frontend()
    elif choice == "3":
        print_info("\nYou can run these in separate terminals:\n")
        print("Terminal 1 (Backend):")
        print(f"  cd {BACKEND_DIR}")
        print("  python -m uvicorn app.main:app --reload\n")
        print("Terminal 2 (Frontend):")
        print(f"  cd {FRONTEND_DIR}")
        print("  npm install")
        print("  npm run dev\n")
        
        start_backend()
    else:
        print_info("Exiting")
        sys.exit(0)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup interrupted by user")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
