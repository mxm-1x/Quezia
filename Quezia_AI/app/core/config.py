"""
Configuration management for the JEE AI Service.
Uses pydantic-settings for validated, typed env-var loading.
"""
from typing import Optional, Set
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables at runtime."""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    # API Keys
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    POLLINATIONS_API_KEY: str = ""
    PINECONE_API_KEY: str = ""
    PINECONE_INDEX_NAME: str = "jee-questions"
    GOOGLE_API_KEY: str = ""
    
    # LLM Configuration
    LLM_PROVIDER: str = "groq"  # groq, openai
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 8192
    LLM_MAX_CONCURRENT: int = 5
    
    # Image Generation Configuration
    ENABLE_IMAGE_GENERATION: bool = False
    IMAGE_PROVIDER: str = "pollinations"
    POLLINATIONS_MODEL: str = "gpt-image-1-mini"
    IMAGE_SIZE: str = "1024x1024"
    
    # Retry Configuration
    MAX_RETRIES: int = 3
    RETRY_DELAY: float = 1.0
    
    # Service Configuration
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"
    
    # Optional Features
    ENABLE_CACHE: bool = False
    ENABLE_RATE_LIMIT: bool = False
    RATE_LIMIT_MAX_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    @field_validator("LLM_TEMPERATURE")
    @classmethod
    def check_temperature(cls, v):
        if not 0 <= v <= 1:
            raise ValueError("LLM_TEMPERATURE must be between 0 and 1")
        return v

    @field_validator("LLM_MAX_TOKENS")
    @classmethod
    def check_max_tokens(cls, v):
        if v < 1:
            raise ValueError("LLM_MAX_TOKENS must be positive")
        return v

    @field_validator("MAX_RETRIES")
    @classmethod
    def check_max_retries(cls, v):
        if v < 1:
            raise ValueError("MAX_RETRIES must be at least 1")
        return v

    @field_validator("RETRY_DELAY")
    @classmethod
    def check_retry_delay(cls, v):
        if v < 0:
            raise ValueError("RETRY_DELAY must be non-negative")
        return v

    def validate(self) -> None:
        """Validate that at least one LLM API key is configured."""
        has_key = any([
            self.OPENAI_API_KEY,
            self.GROQ_API_KEY,
        ])
        if not has_key:
            raise ValueError(
                "At least one API key is required: "
                "OPENAI_API_KEY or GROQ_API_KEY"
            )


settings = Settings()
