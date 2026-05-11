"""
Shared embedding function.

Both JEEVectorStore and QuestionBank need the same SentenceTransformer model.
Loading it once here saves ~200 MB of RAM and avoids duplicated model init.
"""
import threading
from chromadb.utils import embedding_functions

_lock = threading.Lock()
_embedding_fn = None

MODEL_NAME = "all-MiniLM-L6-v2"


def get_embedding_fn() -> embedding_functions.SentenceTransformerEmbeddingFunction:
    """Return a shared, lazily-initialized SentenceTransformer embedding function."""
    global _embedding_fn
    if _embedding_fn is None:
        with _lock:
            # Double-check after acquiring lock
            if _embedding_fn is None:
                _embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                    model_name=MODEL_NAME
                )
    return _embedding_fn
