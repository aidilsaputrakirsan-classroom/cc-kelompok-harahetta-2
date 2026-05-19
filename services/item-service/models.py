"""Item model — di item_db, BUKAN di auth_db."""
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, default="")
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=0)
    owner_id = Column(Integer, nullable=False)  # Reference ke user di auth_db (bukan FK!)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
