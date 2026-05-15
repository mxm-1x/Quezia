import voyageai
from typing import List
import os
from dotenv import load_dotenv
from app.core.logging import get_logger

load_dotenv()
logger = get_logger(__name__)

# Voyage AI Configuration
MODEL_NAME = "voyage-3"
VOYAGE_API_KEY = os.getenv("VOYAGE_API_KEY")

if not VOYAGE_API_KEY:
    logger.error("VOYAGE_API_KEY not found in environment variables")

vo = voyageai.Client(api_key=VOYAGE_API_KEY)

def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Get embeddings from Voyage AI."""
    try:
        # voyage-3 supports up to 128 documents per request
        # We'll let the user's batching handle the size, 
        # but voyage SDK also has built-in batching if needed.
        result = vo.embed(
            texts, 
            model=MODEL_NAME, 
            input_type="document"
        )
        return result.embeddings
    except Exception as e:
        logger.error("voyage_embedding_failed", error=str(e))
        raise e
