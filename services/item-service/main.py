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
from logging_config import setup_logging
from logging_middleware import RequestLoggingMiddleware
from metrics import metrics

# Setup structured logging
setup_logging()
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

# Logging middleware (setelah CORS)
app.add_middleware(RequestLoggingMiddleware)


# =====================
# HEALTH CHECK (Workshop 13.5)
# =====================


# Helper: Enrich Item with Admin Profile
async def enrich_item(item: Item, db: Session) -> dict:
    admin_info = await get_admin_profile(item.admin_id)
    alamat = admin_info.get("alamat_usaha")
    return {
        "id": item.id,
        "admin_id": item.admin_id,
        "category_id": item.category_id,
        "nama": item.nama,
        "deskripsi": item.deskripsi,
        "harga_per_hari": item.harga_per_hari,
        "stok": item.stok,
        "foto_url": item.foto_url,
        "status": item.status,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        "category": item.category,
        "admin_nama_usaha": admin_info.get("nama_usaha"),
        "admin_alamat_usaha": alamat,
        "admin_kota": extract_city(alamat) if alamat else None,
    }


# Helper: Recalculate Item Status
def _recalculate_item_status(db: Session, item: Item):
    if item.stok > 0:
        item.status = ItemStatus.available
    else:
        # Since rentals are in rental-service db, we degrade gracefully by marking unavailable if stok is 0
        item.status = ItemStatus.unavailable


# ==========================================
# HEALTH & CIRCUIT BREAKER
# ==========================================
@app.get("/health")
def health_check():
    cb_status = auth_circuit.get_status()
    overall = "healthy" if cb_status["state"] == "CLOSED" else "degraded"
    return {
        "status": overall,
        "service": "catalog-service",
        "version": "2.0.0",
        "dependencies": {
            "auth-service": cb_status,
        },
    }

@app.get("/metrics")
def get_metrics():
    """Return application metrics."""
    return {
        "service": "item-service",
        **metrics.get_metrics(),
    }


# ==========================================
# CATEGORIES ENDPOINTS
# ==========================================
@app.get("/categories", response_model=List[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.nama).all()

@app.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(
    data: CategoryCreate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    existing = db.query(Category).filter(Category.nama == data.nama).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kategori dengan nama tersebut sudah ada.")
    category = Category(nama=data.nama, deskripsi=data.deskripsi)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@app.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")
    
    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    return category

@app.delete("/categories/{category_id}", status_code=204)
async def delete_category(
    category_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_super_admin(user)
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")
    db.delete(category)
    db.commit()
    return None


# ==========================================
# PUBLIC ITEM CATALOG ENDPOINTS
# ==========================================
@app.get("/items", response_model=ItemListResponse)
async def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    category: Optional[str] = None,
    admin_id: Optional[int] = None,
    status: Optional[str] = None,
    city: Optional[str] = None,
    sort_price: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Item).options(joinedload(Item.category))

    if search:
        term = f"%{search}%"
        query = query.filter(or_(Item.nama.ilike(term), Item.deskripsi.ilike(term)))

    if category_id:
        query = query.filter(Item.category_id == category_id)

    if category:
        query = query.join(Category).filter(Category.nama.ilike(f"%{category}%"))

    if admin_id:
        query = query.filter(Item.admin_id == admin_id)

    if status:
        try:
            status_enum = ItemStatus(status)
            query = query.filter(Item.status == status_enum)
        except ValueError:
            pass

    if price_min is not None:
        query = query.filter(Item.harga_per_hari >= price_min)
    if price_max is not None:
        query = query.filter(Item.harga_per_hari <= price_max)

    # Sort
    if sort_price == "asc":
        query = query.order_by(Item.harga_per_hari.asc())
    elif sort_price == "desc":
        query = query.order_by(Item.harga_per_hari.desc())
    else:
        query = query.order_by(Item.created_at.desc())

    # Get items
    all_items = query.all()

    # Filter by city (requires call to auth-service for each item, optimized by caching)
    enriched_items = []
    admin_profile_cache = {}

    for item in all_items:
        if item.admin_id not in admin_profile_cache:
            admin_profile_cache[item.admin_id] = await get_admin_profile(item.admin_id)
        
        admin_info = admin_profile_cache[item.admin_id]
        alamat = admin_info.get("alamat_usaha")
        item_city = extract_city(alamat) if alamat else None

        # Filter by city
        if city and (not item_city or city.strip().lower() != item_city.lower()):
            continue

        enriched_items.append({
            "id": item.id,
            "admin_id": item.admin_id,
            "category_id": item.category_id,
            "nama": item.nama,
            "deskripsi": item.deskripsi,
            "harga_per_hari": item.harga_per_hari,
            "stok": item.stok,
            "foto_url": item.foto_url,
            "status": item.status,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
            "category": item.category,
            "admin_nama_usaha": admin_info.get("nama_usaha"),
            "admin_alamat_usaha": alamat,
            "admin_kota": item_city,
        })

    # Pagination on final list
    total = len(enriched_items)
    paginated_items = enriched_items[skip:skip + limit]

    return {"total": total, "items": paginated_items}

@app.get("/items/cities", response_model=List[str])
async def list_item_cities(db: Session = Depends(get_db)):
    # Get distinct admin_ids that have active items
    rows = db.query(Item.admin_id).filter(Item.status != ItemStatus.unavailable).distinct().all()
    cities = set()
    for (admin_id,) in rows:
        admin_info = await get_admin_profile(admin_id)
        alamat = admin_info.get("alamat_usaha")
        if alamat:
            city_name = extract_city(alamat)
            if city_name:
                cities.add(city_name)
    return sorted(cities, key=lambda x: x.lower())

@app.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).options(joinedload(Item.category)).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    return await enrich_item(item, db)


# ==========================================
# ADMIN ITEM MANAGEMENT ENDPOINTS
# ==========================================
@app.post("/items", response_model=ItemResponse, status_code=201)
async def create_item(
    data: ItemCreate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    # Get admin profile ID
    admin_info = await get_admin_profile_by_user_id(user["id"])
    if not admin_info:
        raise HTTPException(status_code=400, detail="Profil admin belum lengkap atau belum dibuat.")
    
    item = Item(
        admin_id=admin_info["id"],
        category_id=data.category_id,
        nama=data.nama,
        deskripsi=data.deskripsi,
        harga_per_hari=data.harga_per_hari,
        stok=data.stok,
        foto_url=data.foto_url,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return await enrich_item(item, db)

@app.put("/items/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: int,
    data: ItemUpdate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")

    # Authorize: admin must own the item OR be superadmin
    if user["role"] != "super_admin":
        admin_info = await get_admin_profile_by_user_id(user["id"])
        if not admin_info or item.admin_id != admin_info["id"]:
            raise HTTPException(status_code=403, detail="Akses ditolak. Anda bukan pemilik barang ini.")

    update_fields = data.model_dump(exclude_unset=True)
    explicit_status = update_fields.pop("status", None)

    for field, value in update_fields.items():
        setattr(item, field, value)

    if "stok" in update_fields and explicit_status is None:
        _recalculate_item_status(db, item)

    if explicit_status is not None:
        item.status = explicit_status

    db.commit()
    db.refresh(item)
    return await enrich_item(item, db)

@app.delete("/items/{item_id}", status_code=204)
async def delete_item(
    item_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")

    if user["role"] != "super_admin":
        admin_info = await get_admin_profile_by_user_id(user["id"])
        if not admin_info or item.admin_id != admin_info["id"]:
            raise HTTPException(status_code=403, detail="Akses ditolak. Anda bukan pemilik barang ini.")

    # Permanently delete in microservice (without rental check or soft delete for simplicity)
    db.delete(item)
    db.commit()
    return None

@app.get("/admin/items", response_model=ItemListResponse)
async def list_my_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: dict = Depends(verify_token_with_auth_service)
):
    check_admin(user)
    admin_info = await get_admin_profile_by_user_id(user["id"])
    if not admin_info:
        raise HTTPException(status_code=400, detail="Profil admin tidak ditemukan.")
    
    query = db.query(Item).filter(Item.admin_id == admin_info["id"])
    total = query.count()
    items = query.order_by(Item.created_at.desc()).offset(skip).limit(limit).all()

    enriched = []
    for item in items:
        enriched.append({
            "id": item.id,
            "admin_id": item.admin_id,
            "category_id": item.category_id,
            "nama": item.nama,
            "deskripsi": item.deskripsi,
            "harga_per_hari": item.harga_per_hari,
            "stok": item.stok,
            "foto_url": item.foto_url,
            "status": item.status,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
            "category": item.category,
            "admin_nama_usaha": admin_info.get("nama_usaha"),
            "admin_alamat_usaha": admin_info.get("alamat_usaha"),
            "admin_kota": extract_city(admin_info.get("alamat_usaha")) if admin_info.get("alamat_usaha") else None,
        })
    return {"total": total, "items": enriched}

@app.post("/admin/items/fix-status")
async def fix_items_status(
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db)
):
    check_admin(user)
    query = db.query(Item)
    if user["role"] != "super_admin":
        admin_info = await get_admin_profile_by_user_id(user["id"])
        if not admin_info:
            raise HTTPException(status_code=400, detail="Profil admin tidak ditemukan.")
        query = query.filter(Item.admin_id == admin_info["id"])
    
    items = query.all()
    count = 0
    for item in items:
        _recalculate_item_status(db, item)
        count += 1
    db.commit()
    return {"message": f"Berhasil memperbarui status {count} barang berdasarkan stok."}

@app.get("/admins/{admin_id}/items", response_model=ItemListResponse)
async def get_shop_items(
    admin_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    item_status: str = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    admin_info = await get_admin_profile(admin_id)
    if not admin_info:
        raise HTTPException(status_code=404, detail="Admin tidak ditemukan")
    
    query = db.query(Item).options(joinedload(Item.category)).filter(Item.admin_id == admin_id)
    if search:
        query = query.filter(or_(Item.nama.ilike(f"%{search}%"), Item.deskripsi.ilike(f"%{search}%")))
    if item_status:
        try:
            status_enum = ItemStatus(item_status)
            query = query.filter(Item.status == status_enum)
        except ValueError:
            pass
            
    total = query.count()
    items = query.offset(skip).limit(limit).all()

    enriched = []
    for item in items:
        enriched.append({
            "id": item.id,
            "admin_id": item.admin_id,
            "category_id": item.category_id,
            "nama": item.nama,
            "deskripsi": item.deskripsi,
            "harga_per_hari": item.harga_per_hari,
            "stok": item.stok,
            "foto_url": item.foto_url,
            "status": item.status,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
            "category": item.category,
            "admin_nama_usaha": admin_info.get("nama_usaha"),
            "admin_alamat_usaha": admin_info.get("alamat_usaha"),
            "admin_kota": extract_city(admin_info.get("alamat_usaha")) if admin_info.get("alamat_usaha") else None,
        })
    return {"total": total, "items": enriched}

# ==========================================
# INTERNAL SERVICE ENDPOINTS
# ==========================================
@app.put("/items/internal/{item_id}/decrement-stock")
def decrement_item_stock(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan.")
    if item.stok <= 0:
        raise HTTPException(status_code=400, detail="Stok barang habis.")
    item.stok = max(0, item.stok - 1)
    _recalculate_item_status(db, item)
    db.commit()
    return {"message": "Stok berhasil didecrement.", "stok": item.stok}

@app.put("/items/internal/{item_id}/restore-stock")
def restore_item_stock(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan.")
    item.stok += 1
    _recalculate_item_status(db, item)
    db.commit()
    return {"message": "Stok berhasil dikembalikan.", "stok": item.stok}

