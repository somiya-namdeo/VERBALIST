from typing import Optional, List, Dict, Any
from app.api.dependencies import AuthenticatedUser
from app.services.products import ProductService
from app.services.shopping_list import ShoppingListService
from app.services.history import HistoryService
from app.services.preferences import PreferencesService

class VerbalistTools:
    """
    These methods are bound to the current authenticated user and passed to the LLM.
    The LLM sees their docstrings and type hints, but does not manage the `user_id`.
    """
    def __init__(self, auth: AuthenticatedUser):
        self.auth = auth
        self.found_products = []

    def search_products(self, q: str, category: Optional[str] = None, max_price: Optional[float] = None, on_sale: bool = False) -> dict:
        """Search the product catalog using a text query, category, max_price, or on_sale filter."""
        res = ProductService.search_products(q=q, page=1, size=5, max_price=max_price, on_sale=on_sale)
        self.found_products = res.get("items", []) if isinstance(res, dict) else (res.items if hasattr(res, "items") else [])
        return res

    def get_product(self, product_id: str) -> Optional[dict]:
        """Retrieve exact product details by product_id."""
        return ProductService.get_product(product_id)

    def _resolve_product_name(self, raw_name: str, items: List[dict], name_getter, is_search: bool = True) -> Optional[dict]:
        import re
        def normalize(name: str) -> str:
            name = name.lower().strip()
            
            # Simple Hindi to English mapping
            hindi_aliases = {
                "दूध": "milk",
                "आलू": "potato",
                "धनिया": "coriander",
                "इडली": "idli",
                "केला": "banana",
                "सेब": "apple",
                "संतरा": "orange",
                "टमाटर": "tomato",
                "प्याज": "onion"
            }
            for hi, en in hindi_aliases.items():
                name = name.replace(hi, en)

            stop_words = [
                r'\b\d+\b', r'\bone\b', r'\btwo\b', r'\bthree\b', r'\bfour\b', r'\bfive\b', r'\bsix\b', 
                r'\bseven\b', r'\beight\b', r'\bnine\b', r'\bten\b',
                r'\bbottles?\b', r'\bpacks?\b', r'\bpackets?\b', r'\bkg\b', r'\blitres?\b', r'\bml\b', 
                r'\bgrams?\b', r'\bg\b',
                r'\bof\b', r'\ba\b', r'\ban\b', r'\bthe\b', r'\bsome\b', r'\bpieces?\b', r'\bcartons?\b', 
                r'\bcans?\b', r'\bjars?\b', r'\bboxes?\b', r'\bbars?\b'
            ]
            for pattern in stop_words:
                name = re.sub(pattern, ' ', name)
            name = re.sub(r'\s+', ' ', name).strip()
            if name.endswith('s') and not name.endswith('ss'):
                name = name[:-1]
            return name

        norm_query = normalize(raw_name)
        if not norm_query: norm_query = raw_name.lower().strip()
        query_words = set(norm_query.split())
        
        def get_words_list(text):
            words = []
            for w in re.findall(r'\b\w+\b', text.lower()):
                if w.endswith('s') and not w.endswith('ss'): w = w[:-1]
                words.append(w)
            return words

        # 1. Exact match
        exact_matches = [i for i in items if norm_query == normalize(name_getter(i))]
        if len(exact_matches) > 0: return exact_matches[0]
            
        # 2. Token subset match
        threshold = 0.15 if (len(items) == 1 or not is_search) else 0.33
        
        best_matches = []
        best_score = 0
        for item in items:
            iw_list = get_words_list(name_getter(item))
            item_words = set(iw_list)
            if query_words.issubset(item_words):
                score = len(query_words) / len(item_words) if len(item_words) > 0 else 0
                if score >= threshold:
                    if score > best_score:
                        best_score = score
                        best_matches = [item]
                    elif score == best_score:
                        best_matches.append(item)
                    
        if best_matches:
            return best_matches[0]
            
        # 3. Substring match
        substr_matches = []
        for item in items:
            name_val = name_getter(item)
            if re.search(r'\b' + re.escape(norm_query) + r'(?:s)?\b', name_val.lower()):
                iw_list = get_words_list(name_val)
                score = len(query_words) / len(set(iw_list)) if len(iw_list) > 0 else 0
                if score >= threshold:
                    substr_matches.append(item)
        if len(substr_matches) == 1:
            return substr_matches[0]
            
        return None

    def find_substitutes(self, product_name: str) -> dict | List[dict]:
        """Find substitute products for a given product by name."""
        search_q = self._apply_hindi_aliases(product_name)
        res = ProductService.search_products(q=search_q, page=1, size=20)
        items = res.get("items", []) if isinstance(res, dict) else getattr(res, "items", [])
        resolved = self._resolve_product_name(product_name, items, lambda x: x["name"] if isinstance(x, dict) else x.name)
        if not resolved: return {"error": f"I couldn't find a matching product for {product_name}."}
        pid = resolved["id"] if isinstance(resolved, dict) else resolved.id
        subs = ProductService.get_product_substitutes(pid)
        if not subs:
            return {"error": f"I couldn't find a suitable substitute for {product_name}."}
        self.found_products = subs
        return subs

    def find_seasonal_products(self, limit: int = 10, **kwargs) -> List[dict]:
        """Get a list of seasonal products currently available."""
        seasonals = ProductService.get_seasonal_products(limit=limit)
        self.found_products = seasonals
        return seasonals

    def get_shopping_list(self, **kwargs) -> List[dict]:
        """Get the current authenticated user's shopping list."""
        return ShoppingListService.get_shopping_list(self.auth)

    def _apply_hindi_aliases(self, name: str) -> str:
        hindi_aliases = {
            "दूध": "milk",
            "आलू": "potato",
            "धनिया": "coriander",
            "इडली": "idli",
            "केला": "banana",
            "सेब": "apple",
            "संतरा": "orange",
            "टमाटर": "tomato",
            "प्याज": "onion"
        }
        res = name.lower()
        for hi, en in hindi_aliases.items():
            res = res.replace(hi, en)
        return res

    def add_to_shopping_list(self, product_name: str, quantity: int = 1) -> dict:
        """Add an item to the shopping list by its product name."""
        search_q = self._apply_hindi_aliases(product_name)
        res = ProductService.search_products(q=search_q, page=1, size=20)
        items = res.get("items", []) if isinstance(res, dict) else getattr(res, "items", [])
        resolved = self._resolve_product_name(product_name, items, lambda x: x["name"] if isinstance(x, dict) else x.name)
        if not resolved:
            return {"error": f"I couldn't find a matching product for {product_name}."}
            
        pid = resolved["id"] if isinstance(resolved, dict) else resolved.id
        return ShoppingListService.add_to_shopping_list(self.auth, {"product_id": pid, "quantity": quantity})

    def update_shopping_list(self, item_name: str, quantity: int) -> Optional[dict]:
        """Update the quantity of an item currently in the shopping list by its name."""
        lst = ShoppingListService.get_shopping_list(self.auth)
        resolved = self._resolve_product_name(item_name, lst, lambda x: (x.get("product") or {}).get("name", ""), is_search=False)
        if resolved:
            res = ShoppingListService.update_shopping_list_item(self.auth, resolved["id"], {"quantity": quantity})
            if res:
                res["resolved_name"] = (resolved.get("product") or {}).get("name", item_name)
                return res
            return {"error": f"Failed to update {item_name} in database."}
        return {"error": f"Item {item_name} not found in shopping list"}

    def remove_from_shopping_list(self, item_name: str) -> dict:
        """Remove an item from the shopping list using its product name."""
        lst = ShoppingListService.get_shopping_list(self.auth)
        resolved = self._resolve_product_name(item_name, lst, lambda x: (x.get("product") or {}).get("name", ""), is_search=False)
        if resolved:
            success = ShoppingListService.remove_from_shopping_list(self.auth, resolved["id"])
            if success:
                return {"success": True, "resolved_name": (resolved.get("product") or {}).get("name", item_name)}
        return {"error": f"Item {item_name} not found in shopping list"}

    def get_purchase_history(self, limit: int = 10) -> List[dict]:
        """Get the user's past purchase history."""
        # Note: In a real app we'd paginate, we just slice here for simplicity.
        history = HistoryService.get_shopping_history(self.auth)
        return history[:limit]

    def record_purchase(self, product_ids: List[str]) -> List[dict]:
        """Record the purchase of one or more products and add them to history."""
        results = []
        for pid in product_ids:
            res = HistoryService.create_shopping_history(self.auth, {"product_id": pid, "quantity": 1})
            results.append(res)
        return results

    def get_preferences(self, **kwargs) -> Optional[dict]:
        """Get the user's dietary and brand preferences."""
        return PreferencesService.get_preferences(self.auth)

    def update_preferences(
        self, 
        preferred_brands: Optional[List[str]] = None,
        preferred_categories: Optional[List[str]] = None,
        dietary_preferences: Optional[List[str]] = None,
        preferred_units: Optional[List[str]] = None
    ) -> dict:
        """Update the user's shopping preferences."""
        data = {}
        if preferred_brands is not None: data["preferred_brands"] = preferred_brands
        if preferred_categories is not None: data["preferred_categories"] = preferred_categories
        if dietary_preferences is not None: data["dietary_preferences"] = dietary_preferences
        if preferred_units is not None: data["preferred_units"] = preferred_units
        return PreferencesService.update_preferences(self.auth, data)

    def recommend_products(self, limit: int = 5, **kwargs) -> List[dict]:
        """Recommend products to the user based on their purchase history, excluding items already in the shopping list."""
        history = HistoryService.get_shopping_history(self.auth)
        shopping_list = ShoppingListService.get_shopping_list(self.auth)
        
        in_list_ids = {item.get("product_id") for item in shopping_list}
        
        # Count frequency of bought products
        from collections import Counter
        freq = Counter()
        prod_map = {}
        for h in history:
            pid = h.get("product_id")
            if pid:
                freq[pid] += h.get("quantity", 1)
                if "product" in h:
                    prod_map[pid] = h["product"]
                    
        # Sort by frequency
        recommended = []
        for pid, count in freq.most_common():
            if pid not in in_list_ids and pid in prod_map:
                recommended.append(prod_map[pid])
            if len(recommended) >= limit:
                break
                
        # Fallback to some default products if history is empty
        if not recommended:
            import random
            res = ProductService.search_products(q="", page=1, size=50)
            items = res.get("items", []) if isinstance(res, dict) else getattr(res, "items", [])
            valid_items = [item for item in items if item.get("id") not in in_list_ids]
            random.shuffle(valid_items)
            recommended = valid_items[:limit]
            
        self.found_products = recommended
        return recommended
