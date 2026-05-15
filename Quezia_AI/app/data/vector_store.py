"""
Vector Store for Past JEE Questions
Uses Pinecone for cloud vector search.

Purpose:
- Retrieve similar past questions for RAG
- Provide few-shot examples to LLM
- Extremely low local RAM usage
"""
from typing import List, Dict, Optional, Any
from pinecone import Pinecone, ServerlessSpec
from app.core.config import settings
from app.core.logging import get_logger
from app.data.embeddings import get_embeddings

logger = get_logger(__name__)

class JEEVectorStore:
    """Vector store for past JEE questions using Pinecone."""
    
    def __init__(self):
        """Initialize the Pinecone vector store."""
        if not settings.PINECONE_API_KEY:
            logger.error("pinecone_api_key_missing")
            self.index = None
            return

        self.pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index_name = settings.PINECONE_INDEX_NAME
        
        # Ensure index exists (optional, usually done in setup)
        if self.index_name not in self.pc.list_indexes().names():
            logger.info("creating_pinecone_index", index_name=self.index_name)
            self.pc.create_index(
                name=self.index_name,
                dimension=1024, # Voyage-3 dimension
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
            
        self.index = self.pc.Index(self.index_name)
        logger.info("vector_store_initialized", index_name=self.index_name)
    
    def search_similar(
        self, 
        query: str, 
        subject: Optional[str] = None,
        chapter: Optional[str] = None,
        n_results: int = 3
    ) -> List[Dict[str, Any]]:
        """Search for similar past questions in Pinecone."""
        if not self.index:
            return []

        # Get embedding for query
        try:
            query_embedding = get_embeddings([query])[0]
        except Exception as e:
            logger.error("query_embedding_failed", error=str(e))
            return []

        # Build filter
        filter_dict = {}
        if subject:
            subject_normalized = subject.lower()
            if subject_normalized in ["math", "maths"]:
                subject_normalized = "mathematics"
            filter_dict["subject"] = subject_normalized
        if chapter:
            filter_dict["chapter"] = chapter.lower().replace(" ", "-")

        try:
            results = self.index.query(
                vector=query_embedding,
                top_k=n_results,
                include_metadata=True,
                filter=filter_dict if filter_dict else None
            )
            
            similar_questions = []
            for match in results.matches:
                meta = match.metadata
                similar_questions.append({
                    "question_text": meta.get("text", ""),
                    "subject": meta.get("subject", ""),
                    "chapter": meta.get("chapter", ""),
                    "year": meta.get("year", ""),
                    "answer": meta.get("answer", ""),
                    "similarity_score": round(match.score, 3)
                })
            
            return similar_questions
            
        except Exception as e:
            logger.error("vector_search_failed", error=str(e))
            return []
    
    def get_few_shot_examples(
        self,
        subject: str,
        topic: str,
        n_examples: int = 2
    ) -> List[Dict[str, Any]]:
        """Get few-shot examples for a specific subject/topic."""
        query = f"{subject} {topic} JEE question"
        return self.search_similar(query=query, subject=subject, n_results=n_examples)

    def get_collection_count(self) -> int:
        """Get total number of questions in the store."""
        if not self.index: return 0
        stats = self.index.describe_index_stats()
        return stats.total_vector_count

# SINGLETON
_vector_store: Optional[JEEVectorStore] = None
_vs_lock = __import__('threading').Lock()

def get_vector_store() -> JEEVectorStore:
    """Get the singleton vector store instance."""
    global _vector_store
    if _vector_store is None:
        with _vs_lock:
            if _vector_store is None:
                _vector_store = JEEVectorStore()
    return _vector_store

def initialize_vector_store_from_file(filepath: str, reset: bool = False):
    """
    Initialize Pinecone index from local JSON file.
    Note: This will perform many API calls and is best done once locally.
    """
    import json
    from pathlib import Path
    
    store = get_vector_store()
    if not store.index: return
    
    with open(filepath, "r", encoding="utf-8") as f:
        questions = json.load(f)

    logger.info("loading_to_pinecone", count=len(questions))
    
    BATCH_SIZE = 100
    for i in range(0, len(questions), BATCH_SIZE):
        batch = questions[i:i+BATCH_SIZE]
        texts = [f"{q.get('chapter')}: {q.get('text')}" for q in batch]
        
        try:
            embeddings = get_embeddings(texts)
            vectors = []
            for j, q in enumerate(batch):
                q_id = f"jee_{q.get('subject')}_{i+j}"
                vectors.append({
                    "id": q_id,
                    "values": embeddings[j],
                    "metadata": {
                        "text": q.get("text"),
                        "subject": q.get("subject"),
                        "chapter": q.get("chapter"),
                        "year": str(q.get("year", "")),
                        "answer": str(q.get("answer", ""))
                    }
                })
            store.index.upsert(vectors=vectors)
            logger.info("pinecone_batch_uploaded", progress=f"{i+len(batch)}/{len(questions)}")
        except Exception as e:
            logger.error("pinecone_batch_failed", error=str(e))
