from typing import List, Dict, Any
from app.api.dependencies import AuthenticatedUser
import json

class HistoryService:
    @staticmethod
    def get_shopping_history(auth: AuthenticatedUser) -> List[Dict[str, Any]]:
        response = auth.client.table("shopping_history").select("*, product:products(*)").eq("user_id", str(auth.user_id)).execute()
        return response.data

    @staticmethod
    def create_shopping_history(auth: AuthenticatedUser, data: Dict[str, Any]) -> Dict[str, Any]:
        data['user_id'] = str(auth.user_id)
        response = auth.client.table("shopping_history").insert(data).execute()
        return response.data[0]
