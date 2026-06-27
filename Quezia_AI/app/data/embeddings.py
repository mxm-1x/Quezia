"""
Embedding client for question retrieval.

Uses OpenRouter's OpenAI-compatible embeddings API by default so the AI service
can run generation and retrieval through the same provider account.
"""
from typing import List

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings"
MAX_BATCH_SIZE = 128


def _chunk_texts(texts: List[str], batch_size: int = MAX_BATCH_SIZE):
    for i in range(0, len(texts), batch_size):
        yield texts[i:i + batch_size]


def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Get embeddings for a list of texts using OpenRouter."""
    if not texts:
        return []

    if settings.EMBEDDING_PROVIDER.lower() != "openrouter":
        raise ValueError(
            f"Unsupported EMBEDDING_PROVIDER={settings.EMBEDDING_PROVIDER}. "
            "Only openrouter is currently configured."
        )

    if not settings.OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY is required for embeddings")

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://quezia.ai",
        "X-Title": "Quezia AI Service",
    }

    embeddings: List[List[float]] = []

    try:
        with httpx.Client(timeout=60.0) as client:
            for batch in _chunk_texts(texts):
                response = client.post(
                    OPENROUTER_EMBEDDINGS_URL,
                    headers=headers,
                    json={
                        "model": settings.EMBEDDING_MODEL,
                        "input": batch,
                    },
                )
                response.raise_for_status()
                payload = response.json()
                data = payload.get("data", [])

                if len(data) != len(batch):
                    raise ValueError(
                        f"Embedding response count mismatch: expected {len(batch)}, got {len(data)}"
                    )

                embeddings.extend(item["embedding"] for item in data)

        return embeddings
    except Exception as e:
        logger.error("embedding_request_failed", error=str(e), model=settings.EMBEDDING_MODEL)
        raise
