from typing import List

import numpy as np

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover
    SentenceTransformer = None


class EmbeddingService:
    MODEL_NAME = "all-MiniLM-L6-v2"
    DIMENSIONS = 384

    def __init__(self):
        self.model = None
        self.available = False

    async def load(self):
        if SentenceTransformer is None:
            self.available = False
            return
        import asyncio

        loop = asyncio.get_event_loop()
        self.model = await loop.run_in_executor(None, lambda: SentenceTransformer(self.MODEL_NAME))
        self.available = True

    async def embed(self, text: str) -> List[float]:
        if not self.available:
            return [0.0] * self.DIMENSIONS
        import asyncio

        loop = asyncio.get_event_loop()
        embedding = await loop.run_in_executor(None, lambda: self.model.encode(text, normalize_embeddings=True))
        return embedding.tolist()

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not self.available:
            return [[0.0] * self.DIMENSIONS for _ in texts]
        import asyncio

        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(None, lambda: self.model.encode(texts, normalize_embeddings=True, batch_size=32))
        return embeddings.tolist()

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        a = np.array(vec_a)
        b = np.array(vec_b)
        if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
            return 0.0
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

    async def find_most_similar(self, query_embedding: List[float], candidates: List[dict], embedding_field: str = "embedding", top_k: int = 5, threshold: float = 0.75) -> List[dict]:
        if not candidates:
            return []
        results = []
        for candidate in candidates:
            emb = candidate.get(embedding_field, [])
            if not emb or len(emb) != self.DIMENSIONS:
                continue
            sim = self.cosine_similarity(query_embedding, emb)
            if sim >= threshold:
                results.append({**candidate, "_similarity": sim})
        results.sort(key=lambda x: x["_similarity"], reverse=True)
        return results[:top_k]


embedding_service = EmbeddingService()
