from fastapi import APIRouter, Depends, HTTPException, Path
from typing import List
from app.schemas.schemas import ShoppingListItem, ShoppingListItemCreate, ShoppingListItemUpdate
from app.api.dependencies import get_current_user, AuthenticatedUser
from app.services.shopping_list import ShoppingListService
from app.services.history import HistoryService

router = APIRouter()

@router.post("/checkout")
def checkout_shopping_list(auth: AuthenticatedUser = Depends(get_current_user)):
    """
    Mark the current active shopping list as purchased.
    Steps (best-effort, not atomic at DB level):
      1. Read all active items for this user.
      2. If empty, return 200 with purchased_count=0.
      3. Bulk-insert into shopping_history (product_id + quantity per item).
      4. Bulk-delete the shopping_list_items that were purchased.
    Atomicity limitation: Supabase PostgREST does not expose explicit transactions
    over the REST API. Steps 3 and 4 are separate network calls. If step 4 fails
    after step 3 succeeds, history records will exist but the cart will not be
    cleared — the user can retry and history records will be duplicated. This is
    the safest implementable flow without a database function/RPC.
    """
    try:
        # 1. Read active items
        items = ShoppingListService.get_shopping_list(auth)
        active = [i for i in items if i.get("status", "active") == "active" and i.get("product_id")]

        if not active:
            return {"purchased_count": 0, "message": "Cart is empty — nothing to purchase."}

        # 2. Bulk-insert history records
        history_rows = [
            {"product_id": str(i["product_id"]), "quantity": i["quantity"], "user_id": str(auth.user_id)}
            for i in active
        ]
        history_response = auth.client.table("shopping_history").insert(history_rows).execute()
        if not history_response.data:
            raise HTTPException(status_code=500, detail="Failed to record purchase history.")

        # 3. Bulk-delete cart items
        item_ids = [str(i["id"]) for i in active]
        deleted_count = ShoppingListService.bulk_clear_shopping_list(auth, item_ids)

        return {
            "purchased_count": len(active),
            "deleted_count": deleted_count,
            "message": f"Purchased {len(active)} item(s) successfully."
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[ShoppingListItem])
def get_shopping_list(auth: AuthenticatedUser = Depends(get_current_user)):
    try:
        return ShoppingListService.get_shopping_list(auth)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=ShoppingListItem)
def create_shopping_list_item(item: ShoppingListItemCreate, auth: AuthenticatedUser = Depends(get_current_user)):
    try:
        import json
        data = json.loads(item.json(exclude_unset=True))
        return ShoppingListService.add_to_shopping_list(auth, data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{id}", response_model=ShoppingListItem)
def update_shopping_list_item(
    item: ShoppingListItemUpdate, 
    id: str = Path(...), 
    auth: AuthenticatedUser = Depends(get_current_user)
):
    try:
        import json
        data = json.loads(item.json(exclude_unset=True))
        result = ShoppingListService.update_shopping_list_item(auth, id, data)
        if not result:
            raise HTTPException(status_code=404, detail="Item not found or access denied")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
def delete_shopping_list_item(id: str = Path(...), auth: AuthenticatedUser = Depends(get_current_user)):
    try:
        success = ShoppingListService.remove_from_shopping_list(auth, id)
        if not success:
            raise HTTPException(status_code=404, detail="Item not found or access denied")
        return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
