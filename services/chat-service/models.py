"""
models.py — Chat Service Database Models
ChatRoom + ChatMessage saja. User info di-resolve via auth-service.
"""

import enum
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean,
    ForeignKey, UniqueConstraint, Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class ChatRoom(Base):
    """
    Kanal percakapan antara seorang penyewa (user) dengan
    seorang penyedia (admin) terkait satu barang spesifik.

    Pasangan unik: (user_id, admin_id, item_id).
    user_id dan admin_id merujuk ke user.id di auth-service.
    item_id merujuk ke item.id di item-service.
    Semua foreign key bersifat logical (tidak ada FK constraint lintas DB).
    """

    __tablename__ = "chat_rooms"
    __table_args__ = (
        UniqueConstraint("user_id", "admin_id", "item_id", name="uq_chatroom_user_admin_item"),
        Index("ix_chatroom_user", "user_id"),
        Index("ix_chatroom_admin", "admin_id"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)   # user.id dari auth-service
    admin_id = Column(Integer, nullable=False)  # user.id (role=admin) dari auth-service
    item_id = Column(Integer, nullable=True)    # item.id dari item-service
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    messages = relationship(
        "ChatMessage",
        back_populates="room",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )

    def __repr__(self):
        return f"<ChatRoom(id={self.id}, user_id={self.user_id}, admin_id={self.admin_id}, item_id={self.item_id})>"


class ChatMessage(Base):
    """
    Satu pesan teks dalam ChatRoom. Sender bisa user atau admin.
    """

    __tablename__ = "chat_messages"
    __table_args__ = (
        Index("ix_chatmessage_room_created", "room_id", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, nullable=False)  # user.id dari auth-service
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    room = relationship("ChatRoom", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, room_id={self.room_id}, sender_id={self.sender_id})>"
