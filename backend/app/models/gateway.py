import httpx
import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.models.registry import model_registry

logger = logging.getLogger(__name__)


class LocalModelGateway:
    """
    Unified Gateway for local Ollama models.
    Connects DIRECTLY to Ollama API. No fake/mock/simulated responses.
    If Ollama is unavailable, returns a clear error — never silent fake output.
    """
    def __init__(self):
        self.ollama_url = settings.OLLAMA_BASE_URL
        self._available_models: List[str] = []

    async def generate(
        self,
        model_id: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> Dict[str, Any]:
        """
        Send prompt to Ollama and return REAL LLM response.
        No fallback simulation. If Ollama is down, report it clearly.
        """
        # Resolve to an available model
        model_id = await self._resolve_model(model_id)

        payload = {
            "model": model_id,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                res = await client.post(
                    f"{self.ollama_url}/api/generate", json=payload
                )
                if res.status_code == 200:
                    data = res.json()
                    text = data.get("response", "").strip()
                    if not text:
                        text = "[Model returned empty response. Try rephrasing your query.]"
                    return {
                        "model": model_id,
                        "text": text,
                        "provider": "ollama",
                        "status": "success",
                        "eval_count": data.get("eval_count", 0),
                        "total_duration_ms": round(
                            data.get("total_duration", 0) / 1_000_000
                        ),
                    }
                else:
                    logger.error(
                        f"Ollama returned HTTP {res.status_code}: {res.text[:300]}"
                    )
                    return {
                        "model": model_id,
                        "text": f"[LOCAL MODEL ERROR]: Ollama returned HTTP {res.status_code}. "
                        f"Make sure model '{model_id}' is pulled. Run: ollama pull {model_id}",
                        "provider": "ollama",
                        "status": "error",
                    }

        except httpx.ConnectError:
            logger.error("Ollama is not running. Cannot connect to local model.")
            return {
                "model": model_id,
                "text": (
                    "[LOCAL MODEL UNAVAILABLE]\n\n"
                    "Ollama is not running on this machine.\n"
                    "Start it with:  ollama serve\n"
                    f"Then pull a model:  ollama pull {model_id}\n\n"
                    "The Sovereign Workbench requires a local LLM to generate responses."
                ),
                "provider": "ollama",
                "status": "unavailable",
            }
        except httpx.TimeoutException:
            logger.error("Ollama request timed out.")
            return {
                "model": model_id,
                "text": (
                    "[LOCAL MODEL TIMEOUT]\n\n"
                    "The local model took too long to respond. "
                    "This may happen on the first request while the model loads into VRAM. "
                    "Please try again."
                ),
                "provider": "ollama",
                "status": "timeout",
            }
        except Exception as e:
            logger.error(f"Unexpected Ollama error: {e}")
            return {
                "model": model_id,
                "text": f"[LOCAL MODEL ERROR]: {str(e)}",
                "provider": "ollama",
                "status": "error",
            }

    async def _resolve_model(self, requested_model: str) -> str:
        """
        Check if the requested model is available in Ollama.
        If not, fall back to the first available model.
        """
        if not self._available_models:
            await self._refresh_model_list()

        if requested_model in self._available_models:
            return requested_model

        # Try partial match (e.g. "llama3.1:8b" matches "llama3.1:8b")
        for m in self._available_models:
            if requested_model.split(":")[0] in m:
                return m

        # Fall back to first available
        if self._available_models:
            fallback = self._available_models[0]
            logger.info(
                f"Model '{requested_model}' not found. Using '{fallback}' instead."
            )
            return fallback

        return requested_model  # Let Ollama report the error

    async def _refresh_model_list(self):
        """Fetch list of models currently available in Ollama."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.ollama_url}/api/tags")
                if res.status_code == 200:
                    models = res.json().get("models", [])
                    self._available_models = [m["name"] for m in models]
        except Exception:
            self._available_models = []

    async def health_check(self) -> Dict[str, Any]:
        """Check Ollama connectivity and list available models."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.ollama_url}/api/tags")
                if res.status_code == 200:
                    models = res.json().get("models", [])
                    self._available_models = [m["name"] for m in models]
                    return {
                        "status": "online",
                        "provider": "ollama",
                        "models": self._available_models,
                    }
        except Exception:
            pass
        return {
            "status": "offline",
            "provider": "ollama",
            "models": [],
            "error": "Ollama is not running. Start with: ollama serve",
        }


model_gateway = LocalModelGateway()
