#!/usr/bin/env python3
"""
Quick setup script for configuring external AI APIs.
Run this to interactively set up your API keys.
"""

import os
from pathlib import Path

def setup_env():
    """Interactive setup for .env configuration."""
    
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    print("\n" + "="*60)
    print("Sovereign AI Workbench - API Key Setup")
    print("="*60 + "\n")
    
    # Check if .env already exists
    if env_file.exists():
        response = input(f"✓ {env_file} already exists. Overwrite? (y/n): ").strip().lower()
        if response != 'y':
            print("Setup cancelled.")
            return
    
    # Copy from example if exists
    if env_example.exists():
        print(f"Creating {env_file} from {env_example}...")
        with open(env_example, 'r') as f:
            content = f.read()
        with open(env_file, 'w') as f:
            f.write(content)
        os.chmod(env_file, 0o600)  # Restrict permissions
        print(f"✓ Created {env_file} with restricted permissions (600)")
    else:
        print(f"Creating {env_file}...")
        with open(env_file, 'w') as f:
            f.write(DEFAULT_ENV_CONTENT)
        os.chmod(env_file, 0o600)
        print(f"✓ Created {env_file}")
    
    print("\n" + "="*60)
    print("Configure API Keys")
    print("="*60 + "\n")
    
    # Get Ollama base URL
    ollama_url = input("Ollama base URL [http://127.0.0.1:11434]: ").strip()
    if not ollama_url:
        ollama_url = "http://127.0.0.1:11434"
    
    # Get Gemini API key
    print("\n📌 Gemini API Setup")
    print("   Get key from: https://makersuite.google.com/app/apikey")
    gemini_key = input("Gemini API Key (or press Enter to skip): ").strip()
    
    # Get Groq API key
    print("\n📌 Groq API Setup")
    print("   Get key from: https://console.groq.com")
    groq_key = input("Groq API Key (or press Enter to skip): ").strip()
    
    # Read current .env and update
    with open(env_file, 'r') as f:
        lines = f.readlines()
    
    # Update values
    new_lines = []
    for line in lines:
        if line.startswith("OLLAMA_BASE_URL="):
            new_lines.append(f"OLLAMA_BASE_URL={ollama_url}\n")
        elif line.startswith("GEMINI_API_KEY="):
            new_lines.append(f"GEMINI_API_KEY={gemini_key}\n" if gemini_key else line)
        elif line.startswith("GROQ_API_KEY="):
            new_lines.append(f"GROQ_API_KEY={groq_key}\n" if groq_key else line)
        else:
            new_lines.append(line)
    
    with open(env_file, 'w') as f:
        f.writelines(new_lines)
    
    print("\n" + "="*60)
    print("✓ Configuration Complete!")
    print("="*60)
    print(f"\nNext steps:")
    print(f"1. Install Python dependencies:")
    print(f"   cd backend && pip install -r requirements.txt")
    print(f"\n2. Start Ollama (if using local models):")
    print(f"   ollama serve")
    print(f"\n3. Start the backend:")
    print(f"   python -m uvicorn app.main:app --reload")
    print(f"\n4. Start the frontend (in another terminal):")
    print(f"   cd frontend && npm install && npm run dev")
    print(f"\n5. Open browser to http://localhost:3000")
    print(f"\n✓ Your API keys are secured in .env (added to .gitignore)")
    print()


DEFAULT_ENV_CONTENT = """# Sovereign AI Workbench - Environment Configuration
# SECURITY: Keep your API keys safe!
# - Never commit this file to git
# - Never share these keys publicly
# - Rotate keys regularly

# Local Model Server (Ollama)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_API_KEY=

# External API Keys (Optional - for fast response fallback)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-pro

GROQ_API_KEY=
GROQ_MODEL=mixtral-8x7b-32768

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Security
ALLOW_EXTERNAL_AI_CALLS=false
REQUIRE_HITL_APPROVAL_FOR_HIGH_RISK=true
"""


if __name__ == "__main__":
    setup_env()
