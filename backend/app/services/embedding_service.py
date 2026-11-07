import hashlib
import logging
from typing import List
import httpx
import numpy as np
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingError(Exception):
    pass

class EmbeddingService:
    def __init__(self):
        self.provider = settings.EMBEDDING_PROVIDER.lower()
        self.api_key = settings.EMBEDDING_API_KEY
        self.model = settings.EMBEDDING_MODEL
        self.dimensions = settings.EMBEDDING_DIMENSIONS

    def _generate_mock_embedding(self, text: str) -> List[float]:
        """
        Deterministic unit vector generator for tests or offline development.
        Generates consistent embeddings so identical or overlapping terms have higher similarity.
        """
        # Create base vector from hash
        np.random.seed(int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16))
        vec = np.random.randn(self.dimensions).astype(np.float32)

        # Mix in term frequencies for basic word-level overlap in tests
        words = text.lower().split()
        for i, word in enumerate(words[:50]):
            word_hash = int(hashlib.md5(word.encode("utf-8")).hexdigest()[:6], 16)
            idx = word_hash % self.dimensions
            vec[idx] += 2.0

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        if self.provider == "mock" or (not self.api_key and self.provider in ["openai", "gemini"]):
            if not self.api_key and self.provider != "mock":
                logger.info(f"EMBEDDING_API_KEY is not set for provider '{self.provider}'. Using deterministic embedding generator for local operation.")
            return [self._generate_mock_embedding(t) for t in texts]

        if self.provider == "openai":
            return await self._get_openai_embeddings(texts)
        elif self.provider == "gemini":
            return await self._get_gemini_embeddings(texts)
        else:
            return [self._generate_mock_embedding(t) for t in texts]

    async def get_embedding(self, text: str) -> List[float]:
        results = await self.get_embeddings([text])
        return results[0]

    async def _get_openai_embeddings(self, texts: List[str]) -> List[List[float]]:
        url = "https://api.openai.com/v1/embeddings"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "input": texts,
            "dimensions": self.dimensions
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code != 200:
                    raise EmbeddingError(f"OpenAI embedding API error ({response.status_code}): {response.text}")
                data = response.json()
                return [item["embedding"] for item in data["data"]]
            except httpx.RequestError as e:
                raise EmbeddingError(f"Network error calling OpenAI embeddings: {str(e)}")

    async def _get_gemini_embeddings(self, texts: List[str]) -> List[List[float]]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:batchEmbedContents?key={self.api_key}"
        requests = [
            {"model": f"models/{self.model}", "content": {"parts": [{"text": t}]}}
            for t in texts
        ]
        payload = {"requests": requests}
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(url, json=payload)
                if response.status_code != 200:
                    raise EmbeddingError(f"Gemini embedding API error ({response.status_code}): {response.text}")
                data = response.json()
                embeddings = []
                for emb in data.get("embeddings", []):
                    values = emb.get("values", [])
                    # adjust dimensions if necessary
                    if len(values) > self.dimensions:
                        values = values[:self.dimensions]
                    embeddings.append(values)
                return embeddings
            except httpx.RequestError as e:
                raise EmbeddingError(f"Network error calling Gemini embeddings: {str(e)}")

embedding_service = EmbeddingService()
