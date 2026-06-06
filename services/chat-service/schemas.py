"""
schemas.py — Chat Service Pydantic Schemas
"""

from __future__ import annotations
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class ChatRoomCreate(BaseModel):
    item_id: int


class ChatMessageCreate(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Pesan tidak boleh kosong")
        if len(v) > 2000:
            raise ValueError("Pesan terlalu panjang (maks 2000 karakter)")
        return v


# ============================================================
# RESPONSE SCHEMAS
# ============================================================

class ChatMessageResponse(BaseModel):
    id: int
    room_id: int
    sender_id: int
    body: str
    is_read: bool
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ChatRoomResponse(BaseModel):
    id: int
    user_id: int
    admin_id: int
    item_id: Optional[int]
    last_message_at: Optional[datetime]
    created_at: Optional[datetime]

    # Info partner (di-resolve dari auth-service saat runtime)
    partner_id: int = 0
    partner_nama: str = "Pengguna"
    partner_role: str = "user"
    partner_avatar: Optional[str] = None

    # Info item (di-resolve dari item-service saat runtime)
    item_nama: Optional[str] = None
    item_foto_url: Optional[str] = None

    # Statistik pesan
    last_message_preview: Optional[str] = None
    unread_count: int = 0
    partner_online: bool = False

    model_config = {"from_attributes": True}


class ChatRoomListResponse(BaseModel):
    total: int
    rooms: List[ChatRoomResponse]


class ChatMessageListResponse(BaseModel):
    total: int
    messages: List[ChatMessageResponse]
