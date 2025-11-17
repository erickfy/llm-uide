from typing import List, Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str


class BinarySearchStep(BaseModel):
    low: int
    high: int
    mid: int
    mid_value: int
    comparison: str


class BinarySearchRequest(BaseModel):
    array: List[int]
    target: int


class BinarySearchResponse(BaseModel):
    found: bool
    index: Optional[int] = None
    steps: List[BinarySearchStep]