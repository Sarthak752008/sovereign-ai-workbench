# Configuring External AI APIs (Gemini, Groq, Ollama)

## Overview

The Sovereign AI Workbench now supports three LLM providers:

1. **Ollama** (Local, Private) - Default, runs locally on your machine
2. **Groq** (Cloud, Fast) - Excellent for fast inference, reasoning
3. **Gemini** (Cloud, Capable) - Google's advanced model, great for complex tasks

## Setup Steps

### 1. Install Dependencies

Update the backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `google-generativeai` - For Gemini API
- `groq` - For Groq API

### 2. Configure API Keys

#### Create `.env` file in the project root:

```bash
cd sovereign-ai-workbench
```

Create or edit `.env`:

```env
# Ollama (Local)
OLLAMA_BASE_URL=http://127.0.0.1:11434

# Gemini API
GEMINI_API_KEY=your_actual_gemini_key_here
GEMINI_MODEL=gemini-1.5-pro

# Groq API
GROQ_API_KEY=your_actual_groq_key_here
GROQ_MODEL=mixtral-8x7b-32768
```

#### Get API Keys:

**For Gemini:**
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key (free tier available)
3. Copy and paste into `.env`

**For Groq:**
1. Go to https://console.groq.com
2. Create an account and API key
3. Copy and paste into `.env`

### 3. Important: Protect Your Secrets

The `.env` file is in `.gitignore` - **never commit it to git**.

⚠️ **If you accidentally exposed keys:**
- Groq: Invalidate the key in console.groq.com
- Gemini: Regenerate the key in Google AI Studio

## Usage

### Option A: Use Ollama (Local & Private - Recommended)

```bash
# Start Ollama (if not running)
ollama serve

# In another terminal, pull a model
ollama pull llama3.1:8b

# Start the backend - it will use Ollama automatically
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Option B: Use Groq or Gemini as Fallback

The system will automatically fallback to Groq/Gemini if Ollama is unavailable (if you have API keys configured).

### Option C: Force Use of Specific Provider

The new API endpoint supports provider selection:

```bash
POST /api/v1/generate
{
    "prompt": "Your prompt here",
    "provider": "groq",  # or "gemini", "ollama"
    "max_tokens": 2048,
    "temperature": 0.7
}
```

## Performance Notes

- **Ollama (Local):** Slowest but completely private (~1-5s per response)
- **Groq (Cloud):** Fastest inference (~0.5-1s per response)  
- **Gemini (Cloud):** Most capable (~1-2s per response)

## Troubleshooting

### "Ollama not running" error
```bash
# Start Ollama
ollama serve
```

### "API key not configured" warning
Make sure you have the correct key in `.env` and restarted the backend:
```bash
# Check .env file
cat .env

# Restart backend
python -m uvicorn app.main:app --reload
```

### "CORS error" when calling from frontend
The frontend is already configured to call the backend. Make sure:
- Backend is running on `http://localhost:8000`
- Frontend is running on `http://localhost:3000`

## API Integration Example

```python
from app.models.unified_gateway import unified_gateway

# Use default (Ollama with fallback to Groq/Gemini)
response = await unified_gateway.generate(
    prompt="Explain quantum computing",
    fallback_to_external=True,  # Enable fallback
)

# Force specific provider
response = await unified_gateway.generate(
    prompt="Explain quantum computing",
    provider="groq",  # Force Groq
)

# Check availability
available = unified_gateway.get_available_providers()
# Returns: {"ollama": True, "gemini": True, "groq": True}
```

## Production Deployment

For production, use environment variables from your hosting platform:
- **Docker:** Pass via `docker-compose.yml`
- **Kubernetes:** Use Secrets
- **AWS/GCP/Azure:** Use their secret managers

Example `docker-compose.yml`:
```yaml
services:
  backend:
    build: .
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      GROQ_API_KEY: ${GROQ_API_KEY}
      OLLAMA_BASE_URL: http://ollama:11434
```

## Security Best Practices

1. ✅ Store API keys in `.env` (which is in `.gitignore`)
2. ✅ Never commit `.env` to version control
3. ✅ Use environment variables in production
4. ✅ Rotate API keys regularly
5. ✅ Monitor API usage in respective platforms
6. ✅ Prefer local Ollama for sensitive data
7. ❌ Never share API keys in messages, emails, or code reviews
