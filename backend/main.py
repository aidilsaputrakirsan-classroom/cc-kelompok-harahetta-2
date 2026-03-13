from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, Item
from schemas import ItemCreate, ItemUpdate, ItemResponse, ItemListResponse
import crud

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cloud App API",
    description="REST API untuk mata kuliah Komputasi Awan — SI ITK",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== HEALTH CHECK ====================

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "0.2.0"}


# ==================== CRUD ENDPOINTS ====================

@app.post("/items", response_model=ItemResponse, status_code=201)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    return crud.create_item(db=db, item_data=item)


@app.get("/items", response_model=ItemListResponse)
def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    db: Session = Depends(get_db),
):
    return crud.get_items(db=db, skip=skip, limit=limit, search=search)


# ==================== STATS ENDPOINT (DIPINDAH KE ATAS) ====================

@app.get("/items/stats")
def items_stats(db: Session = Depends(get_db)):
    items = db.query(Item).all()

    if not items:
        return {
            "total_items": 0,
            "total_value": 0,
            "most_expensive": None,
            "cheapest": None
        }

    most_expensive_item = max(items, key=lambda x: x.price)
    cheapest_item = min(items, key=lambda x: x.price)

    return {
        "total_items": len(items),
        "total_value": sum(i.price * i.quantity for i in items),
        "most_expensive": {
            "name": most_expensive_item.name,
            "price": most_expensive_item.price
        },
        "cheapest": {
            "name": cheapest_item.name,
            "price": cheapest_item.price
        }
    }


# ==================== ITEM BY ID ====================

@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = crud.get_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Item dengan id={item_id} tidak ditemukan")
    return item


@app.put("/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item: ItemUpdate, db: Session = Depends(get_db)):
    updated = crud.update_item(db=db, item_id=item_id, item_data=item)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Item dengan id={item_id} tidak ditemukan")
    return updated


@app.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    success = crud.delete_item(db=db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Item dengan id={item_id} tidak ditemukan")
    return None


# ==================== TEAM INFO ====================

@app.get("/team")
def team_info():
    return {
        "team": "Harahetta-2",
        "members": [
            {"name": "Djaky Abbyyu Fauzan Timumum", "nim": "10231032", "role": "Lead Backend"},
            {"name": "Achmad Zaki Zaidan", "nim": "10231002", "role": "Lead Frontend"},
            {"name": "Muhammad Alif Setiawan", "nim": "10231056", "role": "Lead DevOps"},
            {"name": "Riqqah Khalda Karina", "nim": "10231082", "role": "Lead QA & Docs"},
        ],
    }

    # Fitur sudah aman ces