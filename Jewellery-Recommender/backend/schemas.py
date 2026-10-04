from pydantic import BaseModel
from typing import List, Optional, Literal

class SearchResult(BaseModel):
    id: str
    image_path: str
    score: float
    category: str
    caption: Optional[str] = None
    interpretation: Optional[str] = None

class TextSearchRequest(BaseModel):
    query: str
    top_k: int = 30

class TextSearchResponse(BaseModel):
    query: str
    refined_query: Optional[str] = None
    results: List[SearchResult]


# ── Chat / Conversational Search ────────────────────────────

class ChatSearchRequest(BaseModel):
    session_id: str
    message: str

class ChatMessageResponse(BaseModel):
    """Returned when the assistant needs more information."""
    type: Literal["message"] = "message"
    message: str

class ChatResultsResponse(BaseModel):
    """Returned when the assistant has enough context to search."""
    type: Literal["results"] = "results"
    query: str
    results: List[SearchResult]
