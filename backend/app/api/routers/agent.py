from fastapi import APIRouter, Depends, HTTPException
from app.agent.schemas import ChatRequest, ChatResponse
from app.agent.agent import VerbalistAgent
from app.api.dependencies import get_current_user, AuthenticatedUser

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def agent_chat(request: ChatRequest, auth: AuthenticatedUser = Depends(get_current_user)):
    try:
        agent = VerbalistAgent(auth=auth, session_id=request.session_id)
        result = agent.chat(request.message)
        
        return ChatResponse(
            response=result["response"],
            tools_used=result["tools_used"],
            found_products=result.get("found_products", [])
        )
    except Exception as e:
        if getattr(e, "code", None) == 429 or getattr(e, "status_code", None) == 429:
            raise HTTPException(status_code=429, detail="AI processing is temporarily rate limited")
        raise HTTPException(status_code=500, detail=str(e))
