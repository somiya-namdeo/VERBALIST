from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.schemas import ShoppingHistory, ShoppingHistoryCreate
from app.api.dependencies import get_current_user, AuthenticatedUser
from app.services.history import HistoryService

router = APIRouter()

@router.get("", response_model=List[ShoppingHistory])
def get_shopping_history(auth: AuthenticatedUser = Depends(get_current_user)):
    try:
        return HistoryService.get_shopping_history(auth)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=ShoppingHistory)
def create_shopping_history(item: ShoppingHistoryCreate, auth: AuthenticatedUser = Depends(get_current_user)):
    try:
        import json
        data = json.loads(item.json())
        return HistoryService.create_shopping_history(auth, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
