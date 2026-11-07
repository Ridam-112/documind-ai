import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocuMind AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database
    # Default to PostgreSQL connection string; will fallback to SQLite if PostgreSQL is unavailable or SQLite URL provided
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/documind",
        description="Database connection string (PostgreSQL with pgvector, or SQLite for local dev/testing)"
    )

    # Security
    JWT_SECRET: str = "documind-development-super-secret-key-change-in-prod-xyz123"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # AI & Embeddings Configuration
    LLM_PROVIDER: str = "groq"  # groq, ollama, openai, gemini, or mock
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "qwen/qwen3.8-27b"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    EMBEDDING_PROVIDER: str = "openai"  # openai, gemini, local, or mock
    EMBEDDING_API_KEY: Optional[str] = None
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536

    # Ingestion / RAG parameters
    CHUNK_SIZE_TOKENS: int = 800
    CHUNK_OVERLAP_TOKENS: int = 120
    RETRIEVAL_TOP_K: int = 5

    # Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 25

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:4173",
        "*"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
