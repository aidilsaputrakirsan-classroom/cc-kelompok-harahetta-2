"""Pydantic schemas for Item Service."""
from pydantic import BaseModel
from typing import Optional


class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    quantity: Optional[int] = 0


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None


class ItemResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    quantity: int
    owner_id: int

    class Config:
        from_attributes = True


class ItemListResponse(BaseModel):
    total: int
    items: list[ItemResponse]


class ItemStatsResponse(BaseModel):
    total_items: int
    total_value: float
    most_expensive: Optional[float] = None
    cheapest: Optional[float] = None
