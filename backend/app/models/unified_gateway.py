"""
Unified AI Model Gateway
Supports: Ollama (local), Gemini (cloud), Groq (cloud)
Routes requests intelligently based on availability and configuration.
"""

import logging
from typing import Dict, Any, Optional, Literal
from app.core.config import settings
from app.models.gateway import LocalModelGateway
from app.models.gemini_gateway import gemini_gateway
from app.models.groq_gateway import groq_gateway

logger = logging.getLogger(__name__)

# Provider type
ProviderType = Literal["ollama", "gemini", "groq"]


class UnifiedAIGateway:
    """
    Intelligent gateway that selects the best available LLM provider.
    Priority: Ollama (local/private) > Groq (fast) > Gemini (capable) > Error
    """
    
    def __init__(self):
        self.ollama = LocalModelGateway()
        self.gemini = gemini_gateway
        self.groq = groq_gateway
        
    def get_available_providers(self) -> Dict[str, bool]:
        """Check which providers are available."""
        return {
            "ollama": True,  # Always available (local)
            "gemini": self.gemini.available,
            "groq": self.groq.available,
        }
    
    async def generate(
        self,
        prompt: str,
        model_id: Optional[str] = None,
        provider: Optional[ProviderType] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        fallback_to_external: bool = False,
    ) -> Dict[str, Any]:
        """
        Generate response using specified or best available provider.
        
        Args:
            prompt: The user prompt
            model_id: Specific model (e.g., "llama3.1:8b", "gemini-1.5-pro")
            provider: Force specific provider ("ollama", "gemini", "groq")
            system_prompt: Optional system prompt
            temperature: Model temperature (0-1)
            max_tokens: Max output tokens
            fallback_to_external: If Ollama fails, try external APIs
        
        Returns:
            Response dict with text, provider, status, usage info
        """
        
        # If specific provider requested, use it
        if provider == "gemini":
            return await self.gemini.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        
        elif provider == "groq":
            return await self.groq.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        
        # Default: Use Ollama (local/private)
        elif provider is None or provider == "ollama":
            result = await self.ollama.generate(
                model_id=model_id or "llama3.1:8b",
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            # If Ollama fails and fallback enabled, try external APIs
            if fallback_to_external and result["status"] in ["error", "unavailable"]:
                logger.warning(f"Ollama unavailable, falling back to external providers")
                
                # Try Groq first (usually fastest)
                if self.groq.available:
                    logger.info("Attempting Groq fallback")
                    result = await self.groq.generate(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    if result["status"] == "success":
                        return result
                
                # Then try Gemini
                if self.gemini.available:
                    logger.info("Attempting Gemini fallback")
                    result = await self.gemini.generate(
                        prompt=prompt,
                        system_prompt=system_prompt,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    if result["status"] == "success":
                        return result
            
            return result
        
        else:
            return {
                "text": f"[ERROR] Unknown provider: {provider}",
                "provider": provider,
                "status": "error",
            }


# Global instance
unified_gateway = UnifiedAIGateway()
