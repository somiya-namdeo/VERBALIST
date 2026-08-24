from fastapi import APIRouter, Query, HTTPException, Path
from typing import Optional, List
from app.schemas.schemas import PaginatedProducts, Product, ProductSubstitute
from app.services.products import ProductService

router = APIRouter()

@router.get("", response_model=PaginatedProducts)
def get_products(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    on_sale: Optional[bool] = None,
    available: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    try:
        return ProductService.get_products(page, size, category, on_sale, available, min_price, max_price)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search", response_model=PaginatedProducts)
def search_products(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None
):
    try:
        return ProductService.search_products(q, page, size, category=category)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/seasonal", response_model=List[Product])
def get_seasonal_products():
    try:
        return ProductService.get_seasonal_products()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=Product)
def get_product(id: str = Path(...)):
    try:
        product = ProductService.get_product(id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}/substitutes", response_model=List[ProductSubstitute])
def get_product_substitutes(id: str = Path(...)):
    try:
        return ProductService.get_product_substitutes(id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
