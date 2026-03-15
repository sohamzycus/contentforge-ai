from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI — LLM (text generation: content, order parsing, etc.)
    AI_API_KEY: str = ""
    AI_BASE_URL: str = "https://api.together.xyz/v1"
    AI_MODEL: str = "meta-llama/Llama-3.3-70B-Instruct-Turbo"

    # AI — Image generation
    IMAGE_API_KEY: Optional[str] = None
    IMAGE_MODEL: str = "black-forest-labs/FLUX.1-schnell"

    # Legacy aliases (fallback if someone sets the old env vars)
    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_BASE_URL: Optional[str] = None
    ANTHROPIC_MODEL: Optional[str] = None
    TOGETHER_API_KEY: Optional[str] = None

    @property
    def effective_ai_api_key(self) -> str:
        return self.AI_API_KEY or self.TOGETHER_API_KEY or self.ANTHROPIC_API_KEY or ""

    @property
    def effective_image_api_key(self) -> str:
        return self.IMAGE_API_KEY or self.TOGETHER_API_KEY or self.AI_API_KEY or ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
