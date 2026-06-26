FROM python:3.12-slim

WORKDIR /app

# Install dependencies first so the layer is cached across code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Application code and static frontend.
COPY app ./app
COPY public ./public

# data/ holds JSON state and uploaded mockups; it is provided at runtime
# as a bind mount (see docker-compose.yml) so state survives container recreation.
EXPOSE 8000

# Bind to 0.0.0.0 so the server is reachable from outside the container.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
