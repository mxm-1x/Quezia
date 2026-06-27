import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# Load env vars
load_dotenv()

# We can import from our refactored app
from app.data.vector_store import get_vector_store
from app.data.embeddings import get_embeddings
from app.core.logging import get_logger

logger = get_logger(__name__)

def migrate():
    # 1. Check for data file
    json_path = Path("jee_main_full.json")
    if not json_path.exists():
        print(f"❌ Error: {json_path} not found in the root directory.")
        return

    # 2. Check for keys
    pinecone_key = os.getenv("PINECONE_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if not pinecone_key or not openrouter_key:
        print("❌ Error: PINECONE_API_KEY and OPENROUTER_API_KEY must be set in your .env file.")
        return

    print("🚀 Starting migration to Pinecone...")
    
    # 3. Load JSON data
    with open(json_path, "r", encoding="utf-8") as f:
        questions = json.load(f)
    
    total_count = len(questions)
    print(f"📦 Loaded {total_count} questions from JSON.")

    # 4. Get Vector Store (will initialize index)
    store = get_vector_store()
    if not store.index:
        print("❌ Error: Could not initialize Pinecone index.")
        return

    # 5. Batch Ingestion
    BATCH_SIZE = 100  # Increased batch size
    start_time = time.time()
    
    for i in range(0, total_count, BATCH_SIZE):
        batch = questions[i:i+BATCH_SIZE]
        
        # Prepare text for embedding: "Chapter: Question"
        texts = []
        for q in batch:
            chapter = q.get("chapter", "General")
            text = q.get("text", "")
            texts.append(f"{chapter}: {text}")
        
        try:
            # Get embeddings from the configured provider.
            embeddings = get_embeddings(texts)
            
            # Prepare vectors for Pinecone
            vectors = []
            for j, q in enumerate(batch):
                # Unique ID
                q_id = f"jee_{q.get('subject', 'unknown')}_{i+j}"
                
                vectors.append({
                    "id": q_id,
                    "values": embeddings[j],
                    "metadata": {
                        "text": q.get("text", "")[:1000], # Pinecone metadata limit
                        "subject": q.get("subject", "unknown"),
                        "chapter": q.get("chapter", "unknown"),
                        "year": str(q.get("year", "2024")),
                        "answer": str(q.get("answer", ""))
                    }
                })
            
            # Upsert to Pinecone
            store.index.upsert(vectors=vectors)
            
            elapsed = time.time() - start_time
            print(f"✅ Ingested {min(i+len(batch), total_count)}/{total_count} ({(min(i+len(batch), total_count)/total_count)*100:.1f}%) | Elapsed: {elapsed:.1f}s")
            
            # Sleep a bit to avoid hitting rate limits
            time.sleep(2.0)
            
        except Exception as e:
            print(f"⚠️ Batch starting at {i} failed: {str(e)}")
            time.sleep(65) # Wait full minute on error to clear quota

    print(f"\n✨ Migration complete! Total time: {time.time() - start_time:.1f}s")

if __name__ == "__main__":
    migrate()
