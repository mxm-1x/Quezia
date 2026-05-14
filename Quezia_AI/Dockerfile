# JEE AI Service - Docker Image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Copy question bank data (needed by app at runtime)
COPY jee_main_full.json ./jee_main_full.json

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Pre-download the embedding model to the appuser's home directory
RUN python -c "from chromadb.utils import embedding_functions; embedding_functions.SentenceTransformerEmbeddingFunction(model_name='all-MiniLM-L6-v2')"

# Expose port (Hugging Face uses 7860 by default)
EXPOSE 7860

# Health check - use a script to handle the dynamic port
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import os, urllib.request; port = os.getenv('PORT', '7860'); urllib.request.urlopen(f'http://localhost:{port}/health', timeout=5)" || exit 1

# Run the application
# We use the shell form to ensure $PORT is expanded. Default to 7860 for HF.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860} --workers 1


