# Dockerfile
FROM python:3.12-slim

# Evita que Python genere archivos .pyc y usa salida sin buffer
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias primero (para cache)
COPY pyproject.toml poetry.lock* /app/

# Instalar Poetry
RUN pip install --no-cache-dir poetry

# Configurar Poetry para instalar en el sistema (sin venv dentro del contenedor)
RUN poetry config virtualenvs.create false

# Instalar dependencias
RUN poetry install --no-root --no-interaction --no-ansi

# Copiar el resto del código
COPY . /app

EXPOSE 8000

# Ejecutar FastAPI con Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]