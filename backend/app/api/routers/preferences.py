from fastapi import APIRouter, Depends, HTTPException
from app.schemas.schemas import UserPreferences, UserPreferencesUpdate
from app.api.dependencies import get_current_user, AuthenticatedUser
from app.services.preferences import PreferencesService

router = APIRouter()

@router.get("", response_model=UserPreferences)
def get_preferences(auth: AuthenticatedUser = Depends(get_current_user)):
    try:
        prefs = PreferencesService.get_preferences(auth)
        if not prefs:
            raise HTTPException(status_code=404, detail="Preferences not found")
        return prefs
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("", response_model=UserPreferences)
def update_preferences(prefs: UserPreferencesUpdate, auth: AuthenticatedUser = Depends(get_current_user)):
    try:
        import json
        data = json.loads(prefs.json(exclude_unset=True))
        return PreferencesService.update_preferences(auth, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
