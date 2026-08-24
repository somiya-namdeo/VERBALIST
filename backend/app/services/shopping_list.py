from typing import List, Dict, Any, Optional
from app.api.dependencies import AuthenticatedUser
import json

class ShoppingListService:
    @staticmethod
    def get_shopping_list(auth: AuthenticatedUser) -> List[Dict[str, Any]]:
        response = auth.client.table("shopping_list_items").select("*, product:products(*)").eq("user_id", str(auth.user_id)).execute()
        return response.data

    @staticmethod
    def add_to_shopping_list(auth: AuthenticatedUser, data: Dict[str, Any]) -> Dict[str, Any]:
        data['user_id'] = str(auth.user_id)
        response = auth.client.table("shopping_list_items").insert(data).execute()
        return response.data[0]

    @staticmethod
    def update_shopping_list_item(auth: AuthenticatedUser, item_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        response = auth.client.table("shopping_list_items").update(data).eq("id", item_id).eq("user_id", str(auth.user_id)).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def remove_from_shopping_list(auth: AuthenticatedUser, item_id: str) -> bool:
        response = auth.client.table("shopping_list_items").delete().eq("id", item_id).eq("user_id", str(auth.user_id)).execute()
        return bool(response.data)

    @staticmethod
    def bulk_clear_shopping_list(auth: AuthenticatedUser, item_ids: List[str]) -> int:
        """Delete all shopping-list items whose IDs are in item_ids. Returns count deleted."""
        if not item_ids:
            return 0
        response = auth.client.table("shopping_list_items").delete().in_("id", item_ids).eq("user_id", str(auth.user_id)).execute()
        return len(response.data)

