from app.providers.base import BaseAIProvider
from app.providers.heuristic_provider import HeuristicProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.anthropic_provider import AnthropicProvider
from app.config import settings

def get_ai_provider() -> BaseAIProvider:
    provider_name = settings.ai_provider.lower().strip()

    if provider_name == "gemini":
        return GeminiProvider()
    elif provider_name == "openai":
        return OpenAIProvider()
    elif provider_name == "anthropic":
        return AnthropicProvider()
    else:
        return HeuristicProvider()
