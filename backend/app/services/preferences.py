from typing import Optional, Dict, Any
from app.api.dependencies import AuthenticatedUser
import json

class PreferencesService:
    @staticmethod
    def get_preferences(auth: AuthenticatedUser) -> Optional[Dict[str, Any]]:
        response = auth.client.table("user_preferences").select("*").eq("user_id", auth.user_id).limit(1).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def update_preferences(auth: AuthenticatedUser, data: Dict[str, Any]) -> Dict[str, Any]:
        data['user_id'] = str(auth.user_id)
        response = auth.client.table("user_preferences").upsert(data, on_conflict="user_id").execute()
        return response.data[0]
