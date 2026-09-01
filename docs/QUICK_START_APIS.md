# 🚀 Quick Start: Multi-Provider AI Setup

This guide helps you get up and running with Ollama, Gemini, and Groq APIs in the Sovereign AI Workbench.

## 📋 What You'll Do

1. Add API keys securely to `.env`
2. Install dependencies
3. Run the backend with multiple AI providers

---

## 🔧 Step 1: Automatic Setup (Recommended)

Run the interactive setup script:

```bash
cd sovereign-ai-workbench
python setup_env.py
```

This will:
- Create a `.env` file with proper permissions (600)
- Prompt you for API keys
- Secure your secrets automatically

**Output:**
```
============================================================
Sovereign AI Workbench - API Key Setup
============================================================

Ollama base URL [http://127.0.0.1:11434]:  [press Enter for default]

📌 Gemini API Setup
   Get key from: https://makersuite.google.com/app/apikey
Gemini API Key (or press Enter to skip): your_gemini_key_here

📌 Groq API Setup
   Get key from: https://console.groq.com
Groq API Key (or press Enter to skip): your_groq_key_here
```

---

## 🔐 Step 2: Manual Setup (If Preferred)

Create `.env` in project root:

```bash
cd sovereign-ai-workbench
```

Edit or create `.env`:

```env
# Ollama (Local - Default)
OLLAMA_BASE_URL=http://127.0.0.1:11434

# Gemini API (Cloud)
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-1.5-pro

# Groq API (Cloud - Fast)
GROQ_API_KEY=your_actual_key_here
GROQ_MODEL=mixtral-8x7b-32768
```

### Get API Keys

**Gemini:**
- Go to https://makersuite.google.com/app/apikey
- Click "Create API Key"
- Copy the key and paste into `.env`

**Groq:**
- Go to https://console.groq.com
- Sign up (free)
- Create an API key
- Copy the key and paste into `.env`

---

## 📦 Step 3: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `google-generativeai` - For Gemini
- `groq` - For Groq
- Plus all existing dependencies

---

## ▶️ Step 4: Start the Services

### Terminal 1: Start Ollama (Optional but Recommended)

```bash
ollama serve
```

First time? Pull a model:
```bash
ollama pull llama3.1:8b
```

Available Ollama models:
- `llama3.1:8b` - Fast general-purpose
- `qwen2.5-coder:7b` - Coding/scripting
- `deepseek-r1:8b` - Reasoning tasks
- `qwen2-vl:7b` - Vision/image analysis

### Terminal 2: Start Backend

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

✅ Backend running at: `http://localhost:8000`

### Terminal 3: Start Frontend

```bash
cd frontend
npm install  # First time only
npm run dev
```

✅ Frontend running at: `http://localhost:3000`

---

## 🧪 Step 5: Test It

### Via Frontend
Open `http://localhost:3000` and submit a task - it will use Ollama by default.

### Via Terminal (API Test)

Use Ollama (default):
```bash
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in 2 sentences",
    "max_tokens": 256
  }'
```

Force Groq (fast):
```bash
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in 2 sentences",
    "provider": "groq",
    "max_tokens": 256
  }'
```

Force Gemini (capable):
```bash
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in 2 sentences",
    "provider": "gemini",
    "max_tokens": 256
  }'
```

With fallback (try Groq if Ollama is down):
```bash
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "fallback_to_external": true,
    "max_tokens": 512
  }'
```

### Check Available Providers

```bash
curl http://localhost:8000/api/v1/health
```

Response:
```json
{
  "status": "ok",
  "sovereign_mode": "ACTIVE",
  "airgap": "ENFORCED",
  "available_providers": {
    "ollama": true,
    "gemini": true,
    "groq": true
  }
}
```

---

## ⚡ Performance Comparison

| Provider | Speed | Privacy | Cost | Best For |
|----------|-------|---------|------|----------|
| **Ollama** | Medium (1-5s) | ✅ Private | Free | Complex reasoning, coding |
| **Groq** | ⚡ Fast (0.5-1s) | Cloud | Cheap | Quick responses, chat |
| **Gemini** | Good (1-2s) | Cloud | Cheap | Advanced tasks, vision |

---

## 🔒 Security Best Practices

✅ **Do:**
- Store API keys in `.env` (added to `.gitignore`)
- Use environment variables in production
- Rotate keys regularly
- Monitor API usage

❌ **Don't:**
- Commit `.env` to git
- Share API keys in messages/emails/PRs
- Store keys in code
- Use production keys in development

---

## 🐛 Troubleshooting

### Error: "Ollama is not running"
```bash
# Start Ollama
ollama serve

# In another terminal, pull a model
ollama pull llama3.1:8b
```

### Error: "GEMINI_API_KEY not configured"
```bash
# Check your .env file exists and has the key
cat .env | grep GEMINI_API_KEY

# Restart backend after adding key
```

### Error: "GROQ_API_KEY not configured"
```bash
# Check your .env file exists and has the key
cat .env | grep GROQ_API_KEY

# Restart backend after adding key
```

### Import Error: "ModuleNotFoundError: google.generativeai"
```bash
# Install dependencies
cd backend
pip install -r requirements.txt --force-reinstall
```

### CORS Error from Frontend
The system should already be configured. If issues persist:
- Backend must be on `http://localhost:8000`
- Frontend must be on `http://localhost:3000`
- Both on same network

---

## 📝 Environment Variables Reference

```env
# Ollama (Local)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_API_KEY=              # Optional, if Ollama requires auth

# Gemini (Google Cloud AI)
GEMINI_API_KEY=              # Required for Gemini
GEMINI_MODEL=gemini-1.5-pro  # Model version

# Groq (Fast Inference)
GROQ_API_KEY=                # Required for Groq
GROQ_MODEL=mixtral-8x7b-32768  # Model version

# Server
HOST=0.0.0.0
PORT=8000

# Security
ALLOW_EXTERNAL_AI_CALLS=false
REQUIRE_HITL_APPROVAL_FOR_HIGH_RISK=true
```

---

## 📚 Next Steps

1. **Deploy to Production**: See [DEPLOYMENT.md](DEPLOYMENT.md)
2. **API Documentation**: See [API.md](API.md)
3. **Advanced Setup**: See [EXTERNAL_API_SETUP.md](EXTERNAL_API_SETUP.md)

---

## 💡 Tips

- Use Ollama for sensitive data (stays local)
- Use Groq for speed (great for chat)
- Use Gemini for complex tasks (most capable)
- Enable fallback to handle outages gracefully
- Monitor usage to avoid unexpected costs

**Happy building! 🎉**
