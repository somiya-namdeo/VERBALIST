from typing import Optional, List, Dict, Any
from app.db.supabase import get_service_client

class ProductService:
    @staticmethod
    def get_products(
        page: int = 1,
        size: int = 20,
        category: Optional[str] = None,
        on_sale: Optional[bool] = None,
        available: Optional[bool] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None
    ) -> Dict[str, Any]:
        supabase = get_service_client()
        query = supabase.table("products").select("*", count="exact")
        
        if category:
            query = query.eq("category", category)
        if on_sale is not None:
            query = query.eq("is_on_sale", on_sale)
        if available is not None:
            query = query.eq("is_available", available)
        if min_price is not None:
            query = query.gte("price", min_price)
        if max_price is not None:
            query = query.lte("price", max_price)
            
        offset = (page - 1) * size
        query = query.range(offset, offset + size - 1)
        
        response = query.execute()
        return {"items": response.data, "total": response.count or 0}

    @staticmethod
    def search_products(q: str, page: int = 1, size: int = 20, max_price: Optional[float] = None, on_sale: bool = False, category: Optional[str] = None) -> Dict[str, Any]:
        supabase = get_service_client()
        offset = (page - 1) * size
        query = supabase.table("products").select("*", count="exact").ilike("name", f"%{q}%")
        if max_price is not None:
            query = query.lte("price", max_price)
        if on_sale:
            query = query.eq("is_on_sale", True)
        if category:
            query = query.eq("category", category)
        response = query.range(offset, offset + size - 1).execute()
        return {"items": response.data, "total": response.count or 0}

    @staticmethod
    def get_product(product_id: str) -> Optional[Dict[str, Any]]:
        supabase = get_service_client()
        response = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def get_seasonal_products(limit: int = 10) -> List[Dict[str, Any]]:
        supabase = get_service_client()
        try:
            response = supabase.table("seasonal_products").select("products(*)").limit(limit).execute()
            data = [row['products'] for row in response.data if row.get('products')]
            if data:
                return data[:limit]
        except:
            pass
        # Fallback to on_sale items as a smart recommendation signal
        response = supabase.table("products").select("*").eq("is_on_sale", True).limit(limit).execute()
        return response.data

    @staticmethod
    def get_product_substitutes(product_id: str) -> List[Dict[str, Any]]:
        supabase = get_service_client()
        try:
            response = supabase.table("product_substitutes").select("substitute_products(*)").eq("product_id", product_id).execute()
            data = [row['substitute_products'] for row in response.data if row.get('substitute_products')]
            if data:
                return data
        except:
            pass
        
        return []
