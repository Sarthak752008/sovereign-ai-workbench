import logging
from typing import Dict, Any, Optional
from groq import Groq
from app.core.config import settings

logger = logging.getLogger(__name__)


class GroqGateway:
    """
    Gateway for Groq API.
    Provides fast cloud-based LLM responses (especially good for reasoning tasks).
    """
    
    def __init__(self):
        self.model_name = settings.GROQ_MODEL
        self.client = None

    @property
    def available(self) -> bool:
        return bool(settings.GROQ_API_KEY)

    def _get_client(self):
        if self.client is None and settings.GROQ_API_KEY:
            self.client = Groq(api_key=settings.GROQ_API_KEY)
        return self.client

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> Dict[str, Any]:
        """
        Generate response using Groq API.
        Excellent for lightning-fast inference (~0.5s).
        """
        client = self._get_client()
        if not client:
            return {
                "model": settings.GROQ_MODEL,
                "text": "[GROQ NOT CONFIGURED] Add GROQ_API_KEY to .env file to enable lightning-fast cloud inference.",
                "provider": "groq",
                "status": "unavailable",
            }

        try:
            messages = []
            
            if system_prompt:
                messages.append({
                    "role": "system",
                    "content": system_prompt
                })
            
            messages.append({
                "role": "user",
                "content": prompt
            })
            
            completion = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            return {
                "model": self.model_name,
                "text": completion.choices[0].message.content,
                "provider": "groq",
                "status": "success",
                "usage": {
                    "prompt_tokens": completion.usage.prompt_tokens,
                    "output_tokens": completion.usage.completion_tokens,
                    "total_tokens": completion.usage.total_tokens,
                }
            }
        
        except Exception as e:
            logger.error(f"Groq API error: {str(e)}")
            return {
                "model": self.model_name,
                "text": f"[GROQ ERROR]: {str(e)}",
                "provider": "groq",
                "status": "error",
            }


# Global instance
groq_gateway = GroqGateway()
