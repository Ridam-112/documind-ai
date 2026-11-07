import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings
from app.services.llm_service import llm_service
from app.services.embedding_service import embedding_service

router = APIRouter()

class AISettingsUpdate(BaseModel):
    llm_provider: str
    llm_api_key: str
    llm_model: str
    embedding_provider: str = "mock"
    embedding_api_key: str = ""

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok",
        "version": settings.VERSION,
        "database": db_status,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
        "llm_key_configured": bool(settings.LLM_API_KEY),
        "embedding_provider": settings.EMBEDDING_PROVIDER,
        "embedding_model": settings.EMBEDDING_MODEL,
        "embedding_key_configured": bool(settings.EMBEDDING_API_KEY),
        "embedding_dimensions": settings.EMBEDDING_DIMENSIONS,
    }

@router.get("/settings/ai")
def get_ai_settings():
    return {
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
        "llm_key_configured": bool(settings.LLM_API_KEY),
        "embedding_provider": settings.EMBEDDING_PROVIDER,
        "embedding_model": settings.EMBEDDING_MODEL,
        "embedding_key_configured": bool(settings.EMBEDDING_API_KEY),
    }

@router.post("/settings/ai")
def update_ai_settings(payload: AISettingsUpdate):
    settings.LLM_PROVIDER = payload.llm_provider.lower().strip()
    settings.LLM_MODEL = payload.llm_model.strip()
    if payload.llm_api_key.strip():
        settings.LLM_API_KEY = payload.llm_api_key.strip()
    
    if payload.embedding_provider:
        settings.EMBEDDING_PROVIDER = payload.embedding_provider.lower().strip()
    if payload.embedding_api_key.strip():
        settings.EMBEDDING_API_KEY = payload.embedding_api_key.strip()

    # If gemini is chosen and embedding provider is set to gemini
    if settings.LLM_PROVIDER == "gemini" and settings.LLM_API_KEY:
        settings.EMBEDDING_PROVIDER = "gemini"
        settings.EMBEDDING_API_KEY = settings.LLM_API_KEY
        settings.EMBEDDING_MODEL = "text-embedding-004"
        settings.EMBEDDING_DIMENSIONS = 768
    elif settings.LLM_PROVIDER == "openai" and settings.LLM_API_KEY:
        settings.EMBEDDING_PROVIDER = "openai"
        settings.EMBEDDING_API_KEY = settings.LLM_API_KEY
        settings.EMBEDDING_MODEL = "text-embedding-3-small"
        settings.EMBEDDING_DIMENSIONS = 1536

    # Refresh services
    llm_service.__init__()
    embedding_service.__init__()

    return {
        "status": "updated",
        "llm_provider": settings.LLM_PROVIDER,
        "llm_model": settings.LLM_MODEL,
        "llm_key_configured": bool(settings.LLM_API_KEY),
        "embedding_provider": settings.EMBEDDING_PROVIDER,
    }
