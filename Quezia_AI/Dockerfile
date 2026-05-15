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

# Port configuration (Render sets $PORT dynamically)

# Expose port (Render sets $PORT dynamically)
EXPOSE 8000

# Health check - use a script to handle the dynamic port from Render
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import os, urllib.request; port = os.getenv('PORT', '8000'); urllib.request.urlopen(f'http://localhost:{port}/health', timeout=5)" || exit 1

# Run the application
# We use the shell form to ensure $PORT is expanded
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1

