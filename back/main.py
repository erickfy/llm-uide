from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    ChatRequest,
    ChatResponse,
    BinarySearchRequest,
    BinarySearchResponse,
)
from llm import generate_answer
from autonomo1.binary_search_with_steps import binary_search_with_steps


app = FastAPI(title="UIDE Jarvis Backend")

origins = [
    "http://localhost:5173",
    "http://uide-jarvis-front.s3-website-us-east-1.amazonaws.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"status": "ok", "message": "Jarvis backend activo"}




@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        answer = await generate_answer(req.message)
        return ChatResponse(answer=answer)
    except Exception as e:
        # Aquí ves el error en el JSON si algo peta
        raise HTTPException(status_code=500, detail=f"Error generando respuesta: {e}")
    
@app.post("/binary-search", response_model=BinarySearchResponse)
async def binary_search_endpoint(req: BinarySearchRequest):
    # Validaciones sencillas
    if not req.array:
        raise HTTPException(status_code=400, detail="El array no puede estar vacío.")

    # Binary search necesita array ordenado
    if req.array != sorted(req.array):
        raise HTTPException(
            status_code=400,
            detail="El array debe venir ordenado de forma ascendente.",
        )

    found, index, steps = binary_search_with_steps(req.array, req.target)

    return BinarySearchResponse(found=found, index=index, steps=steps)