from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    tools_used: List[str] = []
    found_products: List[Any] = []
