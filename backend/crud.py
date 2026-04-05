from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from models import Item, User
from schemas import ItemCreate, ItemUpdate, UserCreate
from auth import hash_password, verify_password


# =========================================================
# ITEM CRUD
# =========================================================

def create_item(db: Session, item_data: ItemCreate) -> Item:
    """Buat item baru di database."""
    db_item = Item(**item_data.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_items(db: Session, skip: int = 0, limit: int = 20, search: str = None, category: str = None):
    """
    Ambil daftar items dengan pagination, search, dan filter kategori.
    """
    query = db.query(Item)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Item.name.ilike(search_term),
                Item.description.ilike(search_term)
            )
        )
    
    if category:
        query = query.filter(Item.category.ilike(f"%{category}%"))

    total = query.count()

    items = (
        query.order_by(Item.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "items": items
    }


def get_item(db: Session, item_id: int) -> Item | None:
    """Ambil satu item berdasarkan ID."""
    return db.query(Item).filter(Item.id == item_id).first()


def update_item(db: Session, item_id: int, item_data: ItemUpdate) -> Item | None:
    """
    Update item berdasarkan ID.
    Hanya field yang dikirim yang akan diupdate.
    """
    db_item = db.query(Item).filter(Item.id == item_id).first()

    if not db_item:
        return None

    update_data = item_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_item, field, value)

    db.commit()
    db.refresh(db_item)

    return db_item


def delete_item(db: Session, item_id: int) -> bool:
    """Hapus item berdasarkan ID."""
    db_item = db.query(Item).filter(Item.id == item_id).first()

    if not db_item:
        return False

    db.delete(db_item)
    db.commit()

    return True


# =========================================================
# INVENTORY STATS
# =========================================================

def get_stats(db: Session) -> dict:
    """
    Ambil statistik inventory menggunakan SQL aggregation.
    """

    total_items = db.query(func.count(Item.id)).scalar() or 0

    if total_items == 0:
        return {
            "total_items": 0,
            "total_quantity": 0,
            "total_value": 0.0,
            "avg_price": 0.0,
            "most_expensive": None,
            "cheapest": None,
        }

    total_quantity = db.query(func.sum(Item.quantity)).scalar() or 0

    total_value = db.query(
        func.sum(Item.price * Item.quantity)
    ).scalar() or 0.0

    avg_price = db.query(func.avg(Item.price)).scalar() or 0.0

    most_expensive = (
        db.query(Item.name, Item.price)
        .order_by(Item.price.desc())
        .first()
    )

    cheapest = (
        db.query(Item.name, Item.price)
        .order_by(Item.price.asc())
        .first()
    )

    return {
        "total_items": total_items,
        "total_quantity": int(total_quantity),
        "total_value": round(float(total_value), 2),
        "avg_price": round(float(avg_price), 2),
        "most_expensive": {
            "name": most_expensive.name,
            "price": most_expensive.price,
        } if most_expensive else None,
        "cheapest": {
            "name": cheapest.name,
            "price": cheapest.price,
        } if cheapest else None,
    }


def get_items_stats(db: Session) -> dict:
    """
    Statistik sederhana untuk endpoint /items/stats
    """
    stats = get_stats(db)

    return {
        "total_items": stats["total_items"],
        "total_stock": stats["total_quantity"],
        "total_inventory_value": stats["total_value"],
    }


def get_categories(db: Session) -> list:
    """
    Ambil semua kategori barang yang unik dari database.
    """
    categories = db.query(Item.category).distinct().filter(Item.category.isnot(None)).all()
    return [cat[0] for cat in categories]


# =========================================================
# USER CRUD
# =========================================================

def create_user(db: Session, user_data: UserCreate) -> User | None:
    """Buat user baru dengan password yang di-hash."""

    existing = db.query(User).filter(User.email == user_data.email).first()

    if existing:
        return None

    db_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hash_password(user_data.password),
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Autentikasi user berdasarkan email & password.
    """

    user = db.query(User).filter(User.email == email).first()

    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user