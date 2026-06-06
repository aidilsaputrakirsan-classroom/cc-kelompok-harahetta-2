"""
chat-service/main.py — Microservice Chat Sewain
Port: 8005

Porting dari backend/chat.py.
- Verifikasi token: call GET /verify ke auth-service
- Resolve admin dari item: call GET /items/{id} ke item-service
- Resolve info user/partner: call GET /users/{id} ke auth-service
"""

from __future__ import annotations

import asyncio
import logging
import os
import time as _time
from datetime import datetime, timezone
from typing import Dict, Iterable, List, Optional, Set

from fastapi import (
    FastAPI, Depends, HTTPException, Header, Query,
    WebSocket, WebSocketDisconnect, status,
)
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc, func, or_
from sqlalchemy.orm import Session

from auth_client import verify_token_with_auth_service, get_user_by_id
from catalog_client import get_item, get_admin_user_id_from_item
from database import engine, get_db, SessionLocal, Base
from models import ChatRoom, ChatMessage
from schemas import (
    ChatMessageCreate, ChatMessageListResponse, ChatMessageResponse,
    ChatRoomCreate, ChatRoomListResponse, ChatRoomResponse,
)

logger = logging.getLogger("sewain.chat")

# ── Buat tabel saat startup ──
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Chat Service",
    description="Chat Realtime Microservice untuk Sewain",
    version="1.0.0",
)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {"status": "healthy", "service": "chat-service"}


# ============================================================
# HEARTBEAT PRESENCE STORE (REST-based)
# ============================================================

_heartbeat_store: Dict[int, float] = {}  # user_id → timestamp last heartbeat
_HEARTBEAT_TTL = 60  # detik


def _is_online_by_heartbeat(user_id: int) -> bool:
    ts = _heartbeat_store.get(user_id)
    if ts is None:
        return False
    return (_time.time() - ts) < _HEARTBEAT_TTL


# ============================================================
# WEBSOCKET CONNECTION MANAGER
# ============================================================

class ConnectionManager:
    """Pelacak koneksi WebSocket per room (in-memory) + presence per user."""

    def __init__(self) -> None:
        self._rooms: Dict[int, Set[WebSocket]] = {}
        self._user_sockets: Dict[int, Set[WebSocket]] = {}
        self._socket_user: Dict[WebSocket, int] = {}
        self._lock = asyncio.Lock()

    async def connect(self, room_id: int, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        first_session = False
        async with self._lock:
            self._rooms.setdefault(room_id, set()).add(websocket)
            user_set = self._user_sockets.setdefault(user_id, set())
            first_session = len(user_set) == 0
            user_set.add(websocket)
            self._socket_user[websocket] = user_id

        if first_session:
            await self._notify_partners_presence(user_id, online=True)

    async def track_presence(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        first_session = False
        async with self._lock:
            user_set = self._user_sockets.setdefault(user_id, set())
            first_session = len(user_set) == 0
            user_set.add(websocket)
            self._socket_user[websocket] = user_id

        if first_session:
            await self._notify_partners_presence(user_id, online=True)

    async def untrack_presence(self, websocket: WebSocket) -> None:
        last_session = False
        owner_id: Optional[int] = None
        async with self._lock:
            owner_id = self._socket_user.pop(websocket, None)
            if owner_id is not None:
                bag = self._user_sockets.get(owner_id)
                if bag:
                    bag.discard(websocket)
                    if not bag:
                        self._user_sockets.pop(owner_id, None)
                        last_session = True

        if last_session and owner_id is not None:
            await self._notify_partners_presence(owner_id, online=False)

    async def disconnect(self, room_id: int, websocket: WebSocket) -> None:
        last_session = False
        owner_id: Optional[int] = None
        async with self._lock:
            conns = self._rooms.get(room_id)
            if conns and websocket in conns:
                conns.discard(websocket)
                if not conns:
                    self._rooms.pop(room_id, None)

            owner_id = self._socket_user.pop(websocket, None)
            if owner_id is not None:
                bag = self._user_sockets.get(owner_id)
                if bag:
                    bag.discard(websocket)
                    if not bag:
                        self._user_sockets.pop(owner_id, None)
                        last_session = True

        if last_session and owner_id is not None:
            await self._notify_partners_presence(owner_id, online=False)

    async def broadcast(self, room_id: int, payload: dict) -> None:
        async with self._lock:
            conns = list(self._rooms.get(room_id, ()))
        for ws in conns:
            try:
                await ws.send_json(payload)
            except Exception:
                logger.debug("Gagal kirim ke socket, akan dibersihkan saat disconnect")

    def schedule_broadcast(self, room_id: int, payload: dict) -> None:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        if loop is None or not loop.is_running():
            return
        loop.create_task(self.broadcast(room_id, payload))

    def is_online(self, user_id: int) -> bool:
        return bool(self._user_sockets.get(user_id))

    def online_users(self, user_ids: Iterable[int]) -> Dict[int, bool]:
        return {uid: bool(self._user_sockets.get(uid)) for uid in user_ids}

    async def _send_to_user(self, user_id: int, payload: dict) -> None:
        async with self._lock:
            sockets = list(self._user_sockets.get(user_id, ()))
        for ws in sockets:
            try:
                await ws.send_json(payload)
            except Exception:
                logger.debug("Gagal kirim presence event")

    async def _notify_partners_presence(self, user_id: int, *, online: bool) -> None:
        def _load_partner_ids() -> List[int]:
            db = SessionLocal()
            try:
                rows = (
                    db.query(ChatRoom.user_id, ChatRoom.admin_id)
                    .filter((ChatRoom.user_id == user_id) | (ChatRoom.admin_id == user_id))
                    .all()
                )
                ids: Set[int] = set()
                for u, a in rows:
                    if u != user_id:
                        ids.add(u)
                    if a != user_id:
                        ids.add(a)
                return list(ids)
            finally:
                db.close()

        try:
            partners = await run_in_threadpool(_load_partner_ids)
        except Exception:
            logger.exception("Gagal mengambil daftar partner saat broadcast presence")
            return

        payload = {
            "type": "presence",
            "data": {"user_id": user_id, "online": online},
        }
        for pid in partners:
            await self._send_to_user(pid, payload)


manager = ConnectionManager()


# ============================================================
# HELPERS
# ============================================================

def _ensure_room_membership(room: ChatRoom, current_user_id: int) -> None:
    if current_user_id not in (room.user_id, room.admin_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda bukan partisipan room ini",
        )


async def _serialize_room(
    db: Session,
    room: ChatRoom,
    viewer_id: int,
) -> ChatRoomResponse:
    """Serialize ChatRoom dengan info partner (dari auth-service) + item (dari item-service)."""
    partner_id = room.admin_id if viewer_id == room.user_id else room.user_id

    # Resolve partner info dari auth-service
    partner_data = await get_user_by_id(partner_id)
    partner_nama = partner_data.get("nama", "Pengguna")
    partner_role = partner_data.get("role", "user")
    partner_avatar = partner_data.get("foto_profil")

    # Jika partner adalah admin, coba gunakan nama_usaha dari profile
    if partner_role in ("admin", "super_admin"):
        admin_profile = partner_data.get("admin_profile")
        if isinstance(admin_profile, dict) and admin_profile.get("nama_usaha"):
            partner_nama = admin_profile["nama_usaha"]

    # Resolve item info dari item-service (kalau ada)
    item_nama = None
    item_foto = None
    if room.item_id:
        item_data = await get_item(room.item_id)
        item_nama = item_data.get("nama")
        item_foto = item_data.get("foto_url")

    last_msg = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room.id)
        .order_by(desc(ChatMessage.created_at))
        .first()
    )
    last_preview = last_msg.body[:80] if last_msg else None

    unread = (
        db.query(func.count(ChatMessage.id))
        .filter(
            ChatMessage.room_id == room.id,
            ChatMessage.sender_id != viewer_id,
            ChatMessage.is_read.is_(False),
        )
        .scalar()
        or 0
    )

    return ChatRoomResponse(
        id=room.id,
        user_id=room.user_id,
        admin_id=room.admin_id,
        item_id=room.item_id,
        last_message_at=room.last_message_at,
        created_at=room.created_at,
        partner_id=partner_id,
        partner_nama=partner_nama,
        partner_role=partner_role,
        partner_avatar=partner_avatar,
        item_nama=item_nama,
        item_foto_url=item_foto,
        last_message_preview=last_preview,
        unread_count=int(unread),
        partner_online=manager.is_online(partner_id) or _is_online_by_heartbeat(partner_id),
    )


def _get_or_create_room(
    db: Session,
    *,
    user_id: int,
    admin_id: int,
    item_id: Optional[int],
) -> ChatRoom:
    if user_id == admin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak bisa membuat room chat dengan diri sendiri",
        )

    query = db.query(ChatRoom).filter(
        ChatRoom.user_id == user_id,
        ChatRoom.admin_id == admin_id,
    )
    if item_id is not None:
        query = query.filter(ChatRoom.item_id == item_id)
    else:
        query = query.filter(ChatRoom.item_id.is_(None))

    room = query.first()
    if room:
        return room

    room = ChatRoom(user_id=user_id, admin_id=admin_id, item_id=item_id)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def _message_to_event(msg: ChatMessage) -> dict:
    return {
        "type": "message",
        "data": {
            "id": msg.id,
            "room_id": msg.room_id,
            "sender_id": msg.sender_id,
            "body": msg.body,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        },
    }


# ============================================================
# REST: Buka room dari item (penyewa)
# ============================================================

@app.post(
    "/chat/rooms",
    response_model=ChatRoomResponse,
    summary="Buka atau ambil room chat dari sebuah item (untuk penyewa)",
)
async def open_room_for_item(
    payload: ChatRoomCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token_with_auth_service),
):
    """
    User (penyewa) menekan tombol 'Tanya admin' di halaman detail item.
    Server cari room (user, admin pemilik item, item) atau buat baru.
    """
    if current_user.get("role") != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya penyewa yang bisa memulai chat dari halaman item",
        )

    # Resolve admin user_id dari item (2 langkah: item-service → auth-service)
    admin_user_id = await get_admin_user_id_from_item(payload.item_id)
    if not admin_user_id:
        raise HTTPException(status_code=404, detail="Item atau penyedia barang tidak ditemukan")

    room = _get_or_create_room(
        db,
        user_id=current_user["id"],
        admin_id=admin_user_id,
        item_id=payload.item_id,
    )
    return await _serialize_room(db, room, viewer_id=current_user["id"])


# ============================================================
# REST: List room saya
# ============================================================

@app.get(
    "/chat/rooms",
    response_model=ChatRoomListResponse,
    summary="List semua room chat saya (sebagai user atau admin)",
)
async def list_my_rooms(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token_with_auth_service),
):
    activity = func.coalesce(ChatRoom.last_message_at, ChatRoom.created_at)
    rooms = (
        db.query(ChatRoom)
        .filter(or_(ChatRoom.user_id == current_user["id"], ChatRoom.admin_id == current_user["id"]))
        .order_by(desc(activity))
        .all()
    )
    serialized = [await _serialize_room(db, r, viewer_id=current_user["id"]) for r in rooms]
    return ChatRoomListResponse(total=len(serialized), rooms=serialized)


@app.get(
    "/chat/unread-count",
    summary="Total pesan yang belum dibaca milik saya",
)
def my_unread_count(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token_with_auth_service),
):
    rooms = db.query(ChatRoom.id).filter(
        or_(ChatRoom.user_id == current_user["id"], ChatRoom.admin_id == current_user["id"])
    ).all()
    room_ids = [r[0] for r in rooms]
    if not room_ids:
        return {"unread": 0}
    total = (
        db.query(func.count(ChatMessage.id))
        .filter(
            ChatMessage.room_id.in_(room_ids),
            ChatMessage.sender_id != current_user["id"],
            ChatMessage.is_read.is_(False),
        )
        .scalar()
        or 0
    )
    return {"unread": int(total)}


@app.post(
    "/chat/heartbeat",
    summary="Ping heartbeat — panggil tiap 30 detik agar status online aktif",
)
def heartbeat_ping(
    current_user: dict = Depends(verify_token_with_auth_service),
):
    _heartbeat_store[current_user["id"]] = _time.time()
    return {"ok": True}


@app.get(
    "/chat/presence",
    summary="Status online dari partner-partner chat saya",
)
def my_partners_presence(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token_with_auth_service),
):
    _heartbeat_store[current_user["id"]] = _time.time()

    rows = (
        db.query(ChatRoom.user_id, ChatRoom.admin_id)
        .filter(or_(ChatRoom.user_id == current_user["id"], ChatRoom.admin_id == current_user["id"]))
        .all()
    )
    partner_ids = set()
    for u, a in rows:
        if u != current_user["id"]:
            partner_ids.add(u)
        if a != current_user["id"]:
            partner_ids.add(a)

    online_list = [
        uid for uid in partner_ids
        if manager.is_online(uid) or _is_online_by_heartbeat(uid)
    ]
    return {"online": online_list}


# ============================================================
# REST: Detail room + pesan
# ============================================================

@app.get(
    "/chat/rooms/{room_id}",
    response_model=ChatRoomResponse,
    summary="Detail room chat",
)
async def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token_with_auth_service),
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room tidak ditemukan")
    _ensure_room_membership(room, current_user["id"])
    return await _serialize_room(db, room, viewer_id=current_user["id"])


@app.get(
    "/chat/rooms/{room_id}/messages",
    response_model=ChatMessageListResponse,
    summary="List pesan dalam sebuah room (paginated, urutan ascending)",
)
def list_room_messages(
    room_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token_with_auth_service),
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room tidak ditemukan")
    _ensure_room_membership(room, current_user["id"])

    total = db.query(func.count(ChatMessage.id)).filter(ChatMessage.room_id == room_id).scalar() or 0
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return ChatMessageListResponse(total=int(total), messages=messages)


@app.post(
    "/chat/rooms/{room_id}/messages",
    response_model=ChatMessageResponse,
    status_code=201,
    summary="Kirim pesan baru ke sebuah room",
)
def send_message(
    room_id: int,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token_with_auth_service),
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room tidak ditemukan")
    _ensure_room_membership(room, current_user["id"])

    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Pesan tidak boleh kosong")

    msg = ChatMessage(
        room_id=room.id,
        sender_id=current_user["id"],
        body=body,
    )
    db.add(msg)
    room.last_message_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)

    try:
        manager.schedule_broadcast(room.id, _message_to_event(msg))
    except Exception:
        logger.exception("Gagal schedule broadcast pesan baru")

    return msg


@app.post(
    "/chat/rooms/{room_id}/read",
    summary="Tandai semua pesan dari partner di room ini sebagai sudah dibaca",
)
def mark_room_read(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token_with_auth_service),
):
    room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room tidak ditemukan")
    _ensure_room_membership(room, current_user["id"])

    updated = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.room_id == room_id,
            ChatMessage.sender_id != current_user["id"],
            ChatMessage.is_read.is_(False),
        )
        .update({"is_read": True}, synchronize_session=False)
    )
    db.commit()
    return {"marked_read": int(updated or 0)}


# ============================================================
# WEBSOCKET — Auth via token query param
# ============================================================

async def _authenticate_ws_token(token: Optional[str]) -> dict:
    """Verifikasi JWT WebSocket via auth-service REST."""
    if not token:
        raise WebSocketDisconnect(code=4401)
    try:
        user_data = await _call_auth_service_ws(token)
        return user_data
    except Exception:
        raise WebSocketDisconnect(code=4401)


async def _call_auth_service_ws(token: str) -> dict:
    import httpx as _httpx
    AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")
    try:
        async with _httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/verify",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0,
            )
        if response.status_code == 200:
            return response.json()
        raise WebSocketDisconnect(code=4401)
    except _httpx.RequestError:
        raise WebSocketDisconnect(code=4401)


async def _load_room_for_user(room_id: int, user_id: int) -> ChatRoom:
    def _load() -> Optional[ChatRoom]:
        db = SessionLocal()
        try:
            return db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
        finally:
            db.close()

    room = await run_in_threadpool(_load)
    if not room:
        raise WebSocketDisconnect(code=4404)
    if user_id not in (room.user_id, room.admin_id):
        raise WebSocketDisconnect(code=4403)
    return room


def _persist_message(room_id: int, sender_id: int, body: str) -> Optional[ChatMessage]:
    """Simpan pesan ke DB (sync, dipanggil via run_in_threadpool)."""
    body = body.strip()
    if not body:
        return None
    db = SessionLocal()
    try:
        room = db.query(ChatRoom).filter(ChatRoom.id == room_id).first()
        if not room or sender_id not in (room.user_id, room.admin_id):
            return None
        msg = ChatMessage(room_id=room_id, sender_id=sender_id, body=body[:2000])
        db.add(msg)
        room.last_message_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(msg)
        return msg
    finally:
        db.close()


@app.websocket("/chat/ws/rooms/{room_id}")
async def chat_websocket(websocket: WebSocket, room_id: int, token: Optional[str] = Query(None)):
    """
    WebSocket realtime untuk satu room. Klien harus mengirim JWT lewat query
    string ?token=... (browser tidak bisa set Authorization header pada WS).

    Protokol pesan klien → server:
        {"type": "message", "body": "..."}

    Protokol pesan server → klien:
        {"type": "message", "data": {...}}
        {"type": "error", "detail": "..."}
        {"type": "pong"}
    """
    user: Optional[dict] = None
    try:
        user = await _authenticate_ws_token(token)
        room = await _load_room_for_user(room_id, user["id"])
        await manager.connect(room.id, user["id"], websocket)

        await websocket.send_json({"type": "ready", "room_id": room.id, "user_id": user["id"]})

        # Kirim status presence partner saat ini supaya UI langsung sinkron.
        partner_id = room.admin_id if user["id"] == room.user_id else room.user_id
        await websocket.send_json({
            "type": "presence",
            "data": {"user_id": partner_id, "online": manager.is_online(partner_id)},
        })

        while True:
            data = await websocket.receive_json()
            kind = data.get("type")

            if kind == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            if kind == "message":
                body = data.get("body", "")
                if not isinstance(body, str) or not body.strip():
                    await websocket.send_json({"type": "error", "detail": "Pesan kosong"})
                    continue
                if len(body) > 2000:
                    await websocket.send_json({"type": "error", "detail": "Pesan terlalu panjang (maks 2000 karakter)"})
                    continue

                saved = await run_in_threadpool(_persist_message, room.id, user["id"], body)
                if not saved:
                    await websocket.send_json({"type": "error", "detail": "Gagal menyimpan pesan"})
                    continue
                await manager.broadcast(room.id, _message_to_event(saved))
                continue

            await websocket.send_json({"type": "error", "detail": f"Tipe pesan tidak dikenali: {kind}"})

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Kesalahan tak terduga pada WebSocket chat")
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
    finally:
        try:
            await manager.disconnect(room_id, websocket)
        except Exception:
            pass


@app.websocket("/chat/ws/presence")
async def presence_websocket(websocket: WebSocket, token: Optional[str] = Query(None)):
    """
    WebSocket presence-only. Frontend menjaga koneksi ini selama user login
    sehingga server tahu ia online walau tidak sedang membuka thread chat.
    """
    user: Optional[dict] = None
    try:
        user = await _authenticate_ws_token(token)
        await manager.track_presence(user["id"], websocket)
        await websocket.send_json({"type": "ready", "user_id": user["id"]})

        while True:
            data = await websocket.receive_json()
            kind = data.get("type") if isinstance(data, dict) else None
            if kind == "ping":
                await websocket.send_json({"type": "pong"})
                continue

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Kesalahan tak terduga pada WebSocket presence")
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
    finally:
        try:
            await manager.untrack_presence(websocket)
        except Exception:
            pass
