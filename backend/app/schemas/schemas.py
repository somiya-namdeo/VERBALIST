from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

# Product Schemas
class Product(BaseModel):
    id: UUID
    name: str
    brand: Optional[str] = None
    category: str
    description: Optional[str] = None
    quantity_value: Optional[float] = None
    quantity_unit: Optional[str] = None
    price: float
    sale_price: Optional[float] = None
    currency: str
    is_on_sale: bool
    is_organic: bool
    is_available: bool
    search_aliases: List[str]
    image_url: Optional[str] = None

class PaginatedProducts(BaseModel):
    items: List[Product]
    total: int

# Shopping List Schemas
class ShoppingListItemBase(BaseModel):
    product_id: Optional[UUID] = None
    raw_query: Optional[str] = None
    quantity: int = 1

class ShoppingListItemCreate(ShoppingListItemBase):
    pass

class ShoppingListItemUpdate(BaseModel):
    quantity: Optional[int] = None
    status: Optional[str] = None

class ShoppingListItem(ShoppingListItemBase):
    id: UUID
    user_id: UUID
    status: str
    created_at: str
    
# Shopping History Schemas
class ShoppingHistoryBase(BaseModel):
    product_id: UUID
    quantity: int

class ShoppingHistoryCreate(ShoppingHistoryBase):
    pass

class ShoppingHistory(ShoppingHistoryBase):
    id: UUID
    user_id: UUID
    purchased_at: str

# User Preferences Schemas
class UserPreferencesBase(BaseModel):
    preferred_brands: Optional[List[str]] = None
    preferred_categories: Optional[List[str]] = None
    dietary_preferences: Optional[List[str]] = None
    preferred_units: Optional[List[str]] = None

class UserPreferencesUpdate(UserPreferencesBase):
    pass

class UserPreferences(UserPreferencesBase):
    user_id: UUID
    created_at: str
    updated_at: str

# Substitutes Schemas
class ProductSubstitute(BaseModel):
    id: UUID
    product_id: UUID
    substitute_product_id: UUID
    confidence_score: float
