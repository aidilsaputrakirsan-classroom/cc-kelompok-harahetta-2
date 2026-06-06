"""
Item Service — Handles inventory management.
Berkomunikasi dengan Auth Service untuk verifikasi token.
Mendukung graceful degradation saat Auth Service down.
"""
import os
import logging
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from database import engine, get_db, SessionLocal, Base
from models import Item
from schemas import (
    ItemCreate, ItemUpdate, ItemResponse,
    ItemListResponse, ItemStatsResponse, PublicItemResponse, PublicItemListResponse,
)
from auth_client import verify_token_with_auth_service, verify_token_optional, auth_circuit

logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Item Service",
    description="Inventory microservice — CRUD items with auth via Auth Service. "
                "Supports graceful degradation when Auth Service is down.",
    version="2.1.0",
)

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================
# HEALTH CHECK (Workshop 13.5)
# =====================

@app.get("/health")
async def health_check():
    """Health check dengan dependency status."""
    # Check Auth Service
    auth_status = auth_circuit.get_status()

    # Check database — gunakan SessionLocal langsung agar session di-close dengan benar
    db_status = "connected"
    db = None
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"
    finally:
        if db:
            db.close()

    overall = "healthy"
    if auth_status["state"] != "CLOSED":
        overall = "degraded"
    if db_status != "connected":
        overall = "unhealthy"

    return {
        "status": overall,
        "service": "item-service",
        "version": "2.1.0",
        "dependencies": {
            "auth-service": {
                "status": "available" if auth_status["state"] == "CLOSED" else "unavailable",
                "circuit_breaker": auth_status,
            },
            "database": {
                "status": db_status,
            },
        },
    }


# =====================
# PUBLIC ENDPOINTS — tanpa auth (Tugas Lead Backend)
# =====================

@app.get("/items/public", response_model=PublicItemListResponse)
async def get_public_items(
    search: str = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Endpoint publik — return daftar item tanpa membutuhkan autentikasi.
    Hanya menampilkan informasi publik (tanpa owner_id).
    """
    query = db.query(Item)
    if search:
        query = query.filter(Item.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.offset(skip).limit(limit).all()

    public_items = [
        PublicItemResponse(
            id=item.id,
            name=item.name,
            description=item.description,
            price=item.price,
            quantity=item.quantity,
        )
        for item in items
    ]

    return PublicItemListResponse(total=total, items=public_items)


# =====================
# DEGRADED ENDPOINTS — auth opsional (Tugas Lead Backend)
# =====================

@app.get("/items/stats", response_model=ItemStatsResponse)
async def get_item_stats(
    user: Optional[dict] = Depends(verify_token_optional),
    db: Session = Depends(get_db),
):
    """
    Statistik items.
    - Full mode (auth OK): return stats items milik user yang login.
    - Degraded mode (auth down): return stats semua items (tanpa filter user).
    """
    degraded = user is None

    if degraded:
        # Degraded mode: stats dari semua items
        logger.info("GET /items/stats — DEGRADED MODE (no auth)")
        items = db.query(Item).all()
    else:
        # Full mode: stats dari items milik user
        items = db.query(Item).filter(Item.owner_id == user["user_id"]).all()

    if not items:
        return ItemStatsResponse(
            total_items=0,
            total_value=0.0,
            degraded_mode=degraded,
        )

    prices = [item.price for item in items]
    return ItemStatsResponse(
        total_items=len(items),
        total_value=sum(prices),
        most_expensive=max(prices),
        cheapest=min(prices),
        degraded_mode=degraded,
    )


# =====================
# PROTECTED ENDPOINTS — auth wajib
# =====================

@app.post("/items", response_model=ItemResponse, status_code=201)
async def create_item(
    item_data: ItemCreate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Buat item baru — requires authentication."""
    try:
        item = Item(
            **item_data.model_dump(),
            owner_id=user["user_id"],
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create item: {e}")
        raise HTTPException(status_code=500, detail="Failed to create item")


@app.get("/items", response_model=ItemListResponse)
async def get_items(
    search: str = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Ambil daftar items milik user yang login."""
    query = db.query(Item).filter(Item.owner_id == user["user_id"])
    if search:
        query = query.filter(Item.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return ItemListResponse(total=total, items=items)


@app.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Ambil item by ID."""
    item = db.query(Item).filter(
        Item.id == item_id, Item.owner_id == user["user_id"]
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.put("/items/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: int,
    update_data: ItemUpdate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Update item."""
    item = db.query(Item).filter(
        Item.id == item_id, Item.owner_id == user["user_id"]
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    try:
        for field, value in update_data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        db.commit()
        db.refresh(item)
        return item
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update item {item_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update item")


@app.delete("/items/{item_id}", status_code=204)
async def delete_item(
    item_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Hapus item."""
    item = db.query(Item).filter(
        Item.id == item_id, Item.owner_id == user["user_id"]
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    try:
        db.delete(item)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete item {item_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete item")
