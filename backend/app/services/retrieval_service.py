import logging
import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.chunk import DocumentChunk
from app.core.config import settings

logger = logging.getLogger(__name__)

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)

class RetrievalService:
    def retrieve_relevant_chunks(
        self,
        db: Session,
        user_id: str,
        document_id: str,
        query_embedding: List[float],
        top_k: int = settings.RETRIEVAL_TOP_K,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top K most similar chunks for a specific document belonging to user_id.
        Works across both PostgreSQL with pgvector and SQLite with vector fallback.
        """
        chunks = (
            db.query(DocumentChunk)
            .filter(
                DocumentChunk.document_id == document_id,
                DocumentChunk.user_id == user_id
            )
            .all()
        )

        if not chunks:
            return []

        scored_chunks = []
        for chunk in chunks:
            if chunk.embedding is None:
                continue
            similarity = cosine_similarity(query_embedding, chunk.embedding)
            scored_chunks.append({
                "id": chunk.id,
                "document_id": chunk.document_id,
                "page_start": chunk.page_start,
                "page_end": chunk.page_end,
                "content": chunk.content,
                "token_count": chunk.token_count,
                "score": similarity
            })

        # Sort by similarity descending
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]

retrieval_service = RetrievalService()
