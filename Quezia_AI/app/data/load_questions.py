"""
Script to load past questions into the vector store.
Run this once to populate the database.

Usage:
    python -m app.data.load_questions
"""
import sys
import time
from pathlib import Path

from app.data.vector_store import initialize_vector_store_from_file, get_vector_store
from app.core.logging import get_logger

logger = get_logger(__name__)


def main():
    """Load questions into vector store."""
    print("=" * 70)
    print(" JEE AI Service - Vector Store Initialization")
    print("=" * 70)
    
    # Check if data file exists
    data_file = Path("./jee_main_full.json")
    if not data_file.exists():
        print(f"\n❌ Error: File not found: {data_file}")
        print("\nPlease ensure jee_main_full.json is in the project root.")
        return 1
    
    # Get file size
    file_size_mb = data_file.stat().st_size / (1024 * 1024)
    print(f"\n📁 Found question file: {data_file.name}")
    print(f"   Size: {file_size_mb:.2f} MB")
    
    # Ask for confirmation
    print("\n⚠️  This will:")
    print("   1. Download sentence-transformer model (~400MB, first time only)")
    print("   2. Create embeddings for all questions")
    print("   3. Store in local ChromaDB database")
    print("\n   Estimated time: 5-10 minutes for ~15,000 questions")
    
    response = input("\nContinue? (y/n): ")
    
    if response.lower() != 'y':
        print("Cancelled.")
        return 0
    
    # Initialize and load
    print("\n🔄 Step 1/3: Initializing vector store...")
    print("   (Downloading embedding model if needed...)")
    
    start_time = time.time()
    
    try:
        store = initialize_vector_store_from_file(
            filepath=str(data_file),
            reset=True  # Fresh start with new data
        )
        
        elapsed = time.time() - start_time
        
        # Get stats
        print("\n🔄 Step 2/3: Getting statistics...")
        stats = store.get_collection_stats()
        
        print("\n✅ Vector store initialized successfully!")
        print(f"⏱️  Time taken: {elapsed:.1f} seconds")
        
        print(f"\n📊 Statistics:")
        print(f"   Total questions: {stats.get('total_questions', 0):,}")
        
        if stats.get('subjects'):
            print(f"\n   By Subject:")
            for subject, count in stats['subjects'].items():
                print(f"      - {subject}: {count:,}")
        
        if stats.get('years'):
            years_sorted = sorted(stats['years'].items())
            print(f"\n   Year Range: {years_sorted[0][0]} - {years_sorted[-1][0]}")
        
        if stats.get('top_chapters'):
            print(f"\n   Top 10 Chapters:")
            for chapter, count in stats['top_chapters'].items():
                print(f"      - {chapter}: {count}")
        
        # Test search
        print("\n🔄 Step 3/3: Testing search functionality...")
        test_results = store.search_similar(
            query="trigonometry sine cosine",
            subject="mathematics",
            n_results=3
        )
        
        if test_results:
            print(f"   ✅ Search working! Found {len(test_results)} similar questions")
            print(f"\n   Sample result:")
            sample = test_results[0]
            print(f"      Chapter: {sample.get('chapter')}")
            print(f"      Year: {sample.get('year')}")
            print(f"      Similarity: {sample.get('similarity_score')}")
            print(f"      Question: {sample.get('question_text', '')[:100]}...")
        else:
            print("   ⚠️  Search returned no results (this may be normal)")
        
        print("\n🎉 Done! Vector store is ready for use.")
        print("\n💡 The questions are now available for:")
        print("   - Few-shot learning (providing examples to LLM)")
        print("   - Semantic search (finding similar questions)")
        print("   - RAG (Retrieval-Augmented Generation)")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        logger.error("vector_store_initialization_failed", error=str(e))
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
