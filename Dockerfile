FROM python:3.9-slim

# Install system dependencies for audio
RUN apt-get update && apt-get install -y \
    portaudio19-dev \
    python3-pyaudio \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application files
COPY . .

# Expose port 5000
EXPOSE 5000

# Run the application on port 5000
CMD ["python", "app.py"]