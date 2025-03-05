# Use an official Python runtime as the base image
FROM python:3.9-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies required for image processing
RUN apt-get update && apt-get install -y \
    libheif-examples \
    ghostscript \
    imagemagick \
    libraw-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements.txt first (optimization for caching)
COPY requirements.txt .

# Install Python dependencies, including Gunicorn
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project into the container
COPY . .

# Expose the port your app will run on
EXPOSE 5000

# Command to run the app with Gunicorn
CMD ["gunicorn", "-w", "2", "-k", "gthread", "-b", "0.0.0.0:5000", "main:app"]