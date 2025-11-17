import os
import httpx
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

SYSTEM_PROMPT = (
    "Eres Jarvis, un asistente útil para estudiantes de la UIDE. "
    "Respondes siempre en español, de forma clara y breve."
)


async def _call_ollama(prompt: str) -> dict:
    """
    Hace una llamada a /api/generate de Ollama y devuelve el JSON.
    """
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
            },
        )

    resp.raise_for_status()
    return resp.json()


async def generate_answer(message: str) -> str:
    """
    Genera una respuesta usando el modelo local de Ollama.
    Reintenta si la primera respuesta solo carga el modelo (done_reason == 'load').
    """
    prompt = f"{SYSTEM_PROMPT}\n\nUsuario: {message}\nAsistente:"

    # Primera llamada
    data = await _call_ollama(prompt)
    text = (data.get("response") or "").strip()
    done_reason = data.get("done_reason")

    # Si solo cargó el modelo y no devolvió texto, reintenta una vez
    if not text and done_reason == "load":
        data = await _call_ollama(prompt)
        text = (data.get("response") or "").strip()
        done_reason = data.get("done_reason")

    if not text:
        # Aquí sí ya consideramos que algo raro pasó
        raise RuntimeError(f"Respuesta inesperada de Ollama: {data}")

    return text