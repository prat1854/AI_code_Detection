import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    app_name: str = "CodeGuard AI Service"
    port: int = int(os.getenv("AI_SERVICE_PORT", "8000"))
    host: str = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    ai_provider: str = os.getenv("AI_PROVIDER", "heuristic").lower()
    
    # Provider Keys
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    
    # Models
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    anthropic_model: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

settings = Settings()
