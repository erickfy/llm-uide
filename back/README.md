# Backend UIDE – Jarvis + Binary Search

Este proyecto es el **backend** del sistema UIDE-Jarvis.  
Está construido con **Python 3 + FastAPI** y expone dos funcionalidades principales:

- Un endpoint de **LLM** tipo “Jarvis” usando un modelo local en **Ollama**.
- Un endpoint de **búsqueda binaria** que devuelve el paso a paso del algoritmo.

---

### Ejecutar pruebas unitarias

```bash
poetry run python -m unittest discover -s tests
```

## Endpoints principales

### `GET /`

Pequeña prueba de vida del backend.

```json
{
  "status": "ok",
  "message": "Jarvis backend activo"
}
```

## Como ejecutar

```bash
poetry install
poetry run uvicorn main:app --reload --port 8000
```

## Respuestas de los Endpoints

### `POST /chat`

**Descripción:**  
Recibe un mensaje en formato JSON y devuelve una respuesta generada por el modelo LLM.

#### **Request**

```json
{
  "message": "¿Cuál es el clima hoy?"
}
```

#### **Response**

```json
{
  "answer": "El clima hoy es soleado en la mayoría de regiones."
}
```

---

### `POST /binary-search`

**Descripción:**  
Recibe un array ordenado de números y un número objetivo.  
Devuelve si el número fue encontrado, su índice (si aplica) y el detalle de cada paso del algoritmo de búsqueda binaria.

#### **Request**

```json
{
  "array": [1, 3, 5, 7, 9],
  "target": 5
}
```

#### **Response**

```json
{
  "found": true,
  "index": 2,
  "steps": [
    {
      "low": 0,
      "high": 4,
      "mid": 2,
      "mid_value": 5,
      "comparison": "found"
    }
  ]
}
```

### _Si el número no es encontrado, `found` será `false` y `index` será `null`, pero igual se muestran los pasos realizados por el algoritmo._
