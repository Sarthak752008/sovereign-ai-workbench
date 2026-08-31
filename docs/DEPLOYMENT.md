# SovereignAI Workbench — Deployment & Docker Setup

## 1. Quick Startup with Docker Compose

To launch the complete SovereignAI Workbench (FastAPI Backend + React Frontend):

```bash
docker compose up --build
```

Access the Workbench UI at `http://localhost:3000` and API at `http://localhost:8000`.

---

## 2. Local Manual Startup

### Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 3. Local Model Engine (Ollama)
Ensure Ollama is running locally:
```bash
ollama run llama3.1:8b
ollama run qwen2.5-coder:7b
ollama run qwen2-vl:7b
ollama run deepseek-r1:8b
```
