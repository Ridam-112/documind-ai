import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from app.models.chunk import DocumentChunk
from app.core.config import settings

logger = logging.getLogger(__name__)

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
        bind = db.get_bind()
        dialect_name = bind.dialect.name if bind else ""

        # Try native pgvector query if on postgresql
        if dialect_name == "postgresql":
            try:
                # Using cosine distance operator
                stmt = (
                    db.query(DocumentChunk)
                    .filter(
                        DocumentChunk.document_id == document_id,
                        DocumentChunk.user_id == user_id
                    )
                    .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
                    .limit(top_k)
                )
                results = stmt.all()
                return [
                    {
                        "id": chunk.id,
                        "document_id": chunk.document_id,
                        "page_start": chunk.page_start,
                        "page_end": chunk.page_end,
                        "content": chunk.content,
                        "token_count": chunk.token_count,
                        "score": 1.0  # approximate
                    }
                    for chunk in results
                ]
            except Exception as e:
                logger.warning(f"Native pgvector query failed ({e}), falling back to in-memory cosine similarity.")

        # Fallback for SQLite / generic SQL:
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

        query_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(query_vec)
        if q_norm == 0:
            q_norm = 1.0

        scored_chunks = []
        for chunk in chunks:
            if chunk.embedding is None:
                continue
            chunk_vec = np.array(chunk.embedding, dtype=np.float32)
            c_norm = np.linalg.norm(chunk_vec)
            if c_norm == 0:
                similarity = 0.0
            else:
                similarity = float(np.dot(query_vec, chunk_vec) / (q_norm * c_norm))

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
