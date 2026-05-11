"""
Vector Store for Past JEE Questions
Uses ChromaDB for local vector search with sentence-transformers embeddings.

Purpose:
- Retrieve similar past questions for RAG
- Provide few-shot examples to LLM
"""
from typing import List, Dict, Optional, Any
from pathlib import Path
import chromadb
from chromadb.config import Settings

from app.core.logging import get_logger
from app.data.embeddings import get_embedding_fn

logger = get_logger(__name__)


class JEEVectorStore:
    """Vector store for past JEE questions using ChromaDB."""
    
    def __init__(self, persist_dir: str = "./app/data/chroma_db"):
        """Initialize the vector store."""
        self.persist_dir = persist_dir
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Use shared sentence-transformers embedding function
        self.embedding_fn = get_embedding_fn()
        
        # Get existing collection
        self.collection = self.client.get_or_create_collection(
            name="jee_questions",
            embedding_function=self.embedding_fn
        )
        
        logger.info(
            "vector_store_initialized",
            collection_count=self.collection.count()
        )
    
    def search_similar(
        self, 
        query: str, 
        subject: Optional[str] = None,
        chapter: Optional[str] = None,
        n_results: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Search for similar past questions.
        
        Args:
            query: Query text (topic or question description)
            subject: Filter by subject (mathematics, physics, chemistry)
            chapter: Filter by specific chapter
            n_results: Number of results to return
            
        Returns:
            List of similar questions with metadata
        """
        # Build where filter
        where_filter = {}
        if subject:
            # Normalize subject name
            subject_normalized = subject.lower()
            if subject_normalized in ["math", "maths"]:
                subject_normalized = "mathematics"
            where_filter["subject"] = subject_normalized
        if chapter:
            where_filter["chapter"] = chapter.lower().replace(" ", "-")
        
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_filter if where_filter else None
            )
            
            # Format results
            similar_questions = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    meta = results["metadatas"][0][i] if results["metadatas"] else {}
                    distance = results["distances"][0][i] if results["distances"] else 0
                    
                    # Extract question text from document (format: "chapter: question")
                    question_text = doc.split(": ", 1)[1] if ": " in doc else doc
                    
                    similar_questions.append({
                        "question_text": question_text,
                        "subject": meta.get("subject", ""),
                        "chapter": meta.get("chapter", ""),
                        "year": meta.get("year", ""),
                        "answer": meta.get("answer", ""),
                        "similarity_score": round(1 - distance, 3)
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
        """
        Get few-shot examples for a specific subject/topic.
        Optimized for LLM prompt injection.
        
        Args:
            subject: Subject name
            topic: Topic/chapter name
            n_examples: Number of examples (default 2 to save tokens)
            
        Returns:
            List of example questions
        """
        # Build a semantic query from subject and topic
        query = f"{subject} {topic} JEE question"
        
        examples = self.search_similar(
            query=query,
            subject=subject,
            n_results=n_examples
        )
        
        logger.debug(
            "few_shot_examples_retrieved",
            subject=subject,
            topic=topic,
            count=len(examples)
        )
        
        return examples
    
    def format_examples_for_prompt(
        self,
        examples: List[Dict[str, Any]],
        max_length: int = 300
    ) -> str:
        """
        Format examples as a string for LLM prompt injection.
        
        Args:
            examples: List of example questions
            max_length: Max length per question text
            
        Returns:
            Formatted string for prompt
        """
        if not examples:
            return ""
        
        formatted = []
        for i, ex in enumerate(examples, 1):
            q_text = ex.get("question_text", "")[:max_length]
            year = ex.get("year", "")
            chapter = ex.get("chapter", "").replace("-", " ").title()
            answer = ex.get("answer", "")
            
            formatted.append(
                f"Example {i} (JEE {year}, {chapter}):\n"
                f"Q: {q_text}...\n"
                f"Correct Answer: {answer}"
            )
        
        return "\n\n".join(formatted)
    
    def get_collection_count(self) -> int:
        """Get total number of questions in the store."""
        return self.collection.count()

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection."""
        count = self.collection.count()
        if count == 0:
            return {"total_questions": 0, "subjects": {}, "years": {}, "top_chapters": {}}

        # Fetch all metadata (ChromaDB get without IDs returns all)
        all_data = self.collection.get(
            include=["metadatas"],
            limit=count,
        )

        subjects: Dict[str, int] = {}
        years: Dict[str, int] = {}
        chapters: Dict[str, int] = {}

        for meta in all_data.get("metadatas", []):
            if not meta:
                continue
            s = meta.get("subject", "unknown")
            subjects[s] = subjects.get(s, 0) + 1

            y = str(meta.get("year", ""))
            if y:
                years[y] = years.get(y, 0) + 1

            ch = meta.get("chapter", "")
            if ch:
                chapters[ch] = chapters.get(ch, 0) + 1

        # Top 10 chapters
        top_chapters = dict(sorted(chapters.items(), key=lambda x: x[1], reverse=True)[:10])

        return {
            "total_questions": count,
            "subjects": subjects,
            "years": years,
            "top_chapters": top_chapters,
        }


# =============================================================================
# SINGLETON
# =============================================================================

_vector_store: Optional[JEEVectorStore] = None
_vs_lock = __import__('threading').Lock()


def get_vector_store() -> JEEVectorStore:
    """Get the singleton vector store instance (thread-safe)."""
    global _vector_store
    if _vector_store is None:
        with _vs_lock:
            if _vector_store is None:
                _vector_store = JEEVectorStore()
    return _vector_store


# =============================================================================
# INITIALIZATION FROM FILE
# =============================================================================

def initialize_vector_store_from_file(
    filepath: str,
    reset: bool = False,
) -> JEEVectorStore:
    """
    Load questions from a JSON file into the vector store.

    Supports the jee_main_full.json format:
        { text, options, chapter, subject, year, exam, answer, correct_options, explanation }

    Args:
        filepath: Path to the JSON file
        reset: If True, delete existing collection and recreate

    Returns:
        Initialized JEEVectorStore
    """
    import json
    from pathlib import Path

    global _vector_store

    data_path = Path(filepath)
    if not data_path.exists():
        raise FileNotFoundError(f"Question file not found: {filepath}")

    # Load JSON
    print(f"   Loading {data_path.name}...")
    with open(data_path, "r", encoding="utf-8") as f:
        questions = json.load(f)

    print(f"   Loaded {len(questions):,} questions from file")

    # Create store (will create chroma_db dir)
    store = JEEVectorStore()

    # Reset if requested
    if reset:
        print("   Resetting existing collection...")
        store.client.delete_collection("jee_questions")
        store.collection = store.client.get_or_create_collection(
            name="jee_questions",
            embedding_function=store.embedding_fn,
        )

    # Skip if already loaded
    existing = store.collection.count()
    if existing >= len(questions):
        print(f"   Collection already has {existing:,} questions. Skipping load.")
        _vector_store = store
        return store

    # Prepare documents, metadatas, and IDs
    BATCH_SIZE = 500  # Smaller batches for progress updates
    total = len(questions)
    loaded = 0
    skipped = 0

    for batch_start in range(0, total, BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, total)
        batch = questions[batch_start:batch_end]

        ids = []
        documents = []
        metadatas = []

        for i, q in enumerate(batch):
            q_text = q.get("text", "")
            if not q_text or len(q_text.strip()) < 10:
                skipped += 1
                continue

            chapter = q.get("chapter", "unknown")
            subject = q.get("subject", "unknown")
            year = q.get("year", 0)
            answer = q.get("answer", "")
            exam = q.get("exam", "JEE Main")

            # Create document text: "chapter: question"
            doc_text = f"{chapter}: {q_text}"

            # Use deterministic ID from index
            q_id = f"jee_{subject}_{batch_start + i}"

            ids.append(q_id)
            documents.append(doc_text)
            metadatas.append({
                "subject": subject,
                "chapter": chapter,
                "year": year,
                "answer": str(answer) if answer else "",
                "exam": exam,
            })

        if ids:
            store.collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
            )
            loaded += len(ids)

        # Progress update
        progress = min(batch_end, total)
        pct = (progress / total) * 100
        print(f"   Progress: {progress:,}/{total:,} ({pct:.0f}%) — loaded {loaded:,}, skipped {skipped}")

    print(f"\n   ✅ Loading complete: {loaded:,} loaded, {skipped} skipped")

    _vector_store = store
    return store
