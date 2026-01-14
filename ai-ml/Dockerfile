# MkulimaLink ML Training Environment
# Docker setup for ML development and production

FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Create non-root user
RUN useradd --create-home --shell /bin/bash mluser
USER mluser

# Set working directory
WORKDIR /app

# Copy application code
COPY --chown=mluser:mluser . /app/

# Create necessary directories
RUN mkdir -p /app/models /app/data /app/logs /app/cache

# Expose ports
EXPOSE 8000 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["python", "-m", "api.main"]
