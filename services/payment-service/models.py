import enum
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text,
    Enum as SAEnum, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class PaymentMethod(str, enum.Enum):
    transfer = "transfer"
    cash = "cash"
    e_wallet = "e_wallet"
    credit_card = "credit_card"
    midtrans = "midtrans"


class WithdrawalStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    rejected = "rejected"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rental_id = Column(Integer, unique=True, nullable=False, index=True)  # Ref rental in rental-service
    user_id = Column(Integer, nullable=False, index=True)    # Ref user in auth-service
    admin_id = Column(Integer, nullable=False, index=True)   # Ref admin in auth-service
    jumlah = Column(Float, nullable=False)
    metode_pembayaran = Column(SAEnum(PaymentMethod), nullable=False, default=PaymentMethod.transfer)
    status = Column(SAEnum(PaymentStatus), nullable=False, default=PaymentStatus.pending)
    bukti_pembayaran = Column(Text, nullable=True)
    catatan = Column(Text, nullable=True)
    tanggal_pembayaran = Column(DateTime(timezone=True), nullable=True)

    # Midtrans fields
    midtrans_order_id = Column(String(100), unique=True, nullable=True, index=True)
    midtrans_transaction_id = Column(String(100), nullable=True)
    snap_token = Column(String(255), nullable=True)
    snap_redirect_url = Column(Text, nullable=True)
    payment_channel = Column(String(50), nullable=True)
    fraud_status = Column(String(20), nullable=True)
    raw_notification = Column(Text, nullable=True)
    charge_response = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    def __repr__(self):
        return f"<Payment(id={self.id}, rental_id={self.rental_id}, status='{self.status}', jumlah={self.jumlah})>"


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    admin_id = Column(Integer, unique=True, nullable=False, index=True)  # Ref admin in auth-service
    saldo = Column(Float, nullable=False, default=0.0)
    total_pendapatan = Column(Float, nullable=False, default=0.0)
    total_withdrawn = Column(Float, nullable=False, default=0.0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    withdrawals = relationship("Withdrawal", back_populates="wallet", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Wallet(id={self.id}, admin_id={self.admin_id}, saldo={self.saldo})>"


class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False)
    admin_id = Column(Integer, nullable=False, index=True)  # Ref admin in auth-service
    jumlah = Column(Float, nullable=False)
    bank_name = Column(String(50), nullable=False)
    account_number = Column(String(50), nullable=False)
    account_holder = Column(String(100), nullable=False)
    status = Column(SAEnum(WithdrawalStatus), nullable=False, default=WithdrawalStatus.pending)
    catatan = Column(Text, nullable=True)
    rejected_reason = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    wallet = relationship("Wallet", back_populates="withdrawals")

    def __repr__(self):
        return f"<Withdrawal(id={self.id}, admin_id={self.admin_id}, jumlah={self.jumlah}, status='{self.status}')>"
