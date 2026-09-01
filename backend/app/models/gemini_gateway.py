import logging
from typing import Dict, Any, Optional
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiGateway:
    """
    Gateway for Google Gemini API.
    Provides fast cloud-based LLM responses as fallback to local models.
    """
    
    def __init__(self):
        self.model_name = settings.GEMINI_MODEL
        self._configured = False

    @property
    def available(self) -> bool:
        return bool(settings.GEMINI_API_KEY)

    def _ensure_configured(self):
        if not self._configured and settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._configured = True
        return self._configured

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """
        Generate response using Google Gemini API.
        """
        if not self.available or not self._ensure_configured():
            return {
                "model": settings.GEMINI_MODEL,
                "text": "[GEMINI NOT CONFIGURED] Add GEMINI_API_KEY to .env file",
                "provider": "gemini",
                "status": "unavailable",
            }

        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_prompt if system_prompt else None,
            )
            
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )
            
            return {
                "model": self.model_name,
                "text": response.text,
                "provider": "gemini",
                "status": "success",
                "usage": {
                    "prompt_tokens": response.usage_metadata.prompt_character_count,
                    "output_tokens": response.usage_metadata.candidates_token_count,
                }
            }
        
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return {
                "model": self.model_name,
                "text": f"[GEMINI ERROR]: {str(e)}",
                "provider": "gemini",
                "status": "error",
            }


# Global instance
gemini_gateway = GeminiGateway()
