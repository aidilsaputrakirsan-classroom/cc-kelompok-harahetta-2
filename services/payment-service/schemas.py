import enum
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class PaymentMethodEnum(str, enum.Enum):
    transfer = "transfer"
    cash = "cash"
    e_wallet = "e_wallet"
    credit_card = "credit_card"
    midtrans = "midtrans"


class WithdrawalStatusEnum(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    rejected = "rejected"


class PaymentCreate(BaseModel):
    rental_id: int = Field(..., examples=[1])
    metode_pembayaran: PaymentMethodEnum = Field(PaymentMethodEnum.transfer, examples=["transfer"])
    catatan: Optional[str] = Field(None, examples=["Transfer ke rek 12345"])


class PaymentUpdate(BaseModel):
    status: PaymentStatusEnum = Field(..., examples=["completed"])
    bukti_pembayaran: Optional[str] = Field(None, examples=["https://storage.sewain.id/bukti/payment1.jpg"])
    catatan: Optional[str] = Field(None, examples=["Sudah transfer"])


class PaymentResponse(BaseModel):
    id: int
    rental_id: int
    user_id: int
    admin_id: int
    jumlah: float
    metode_pembayaran: PaymentMethodEnum
    status: PaymentStatusEnum
    bukti_pembayaran: Optional[str]
    catatan: Optional[str]
    tanggal_pembayaran: Optional[datetime]
    midtrans_order_id: Optional[str] = None
    snap_token: Optional[str] = None
    snap_redirect_url: Optional[str] = None
    payment_channel: Optional[str] = None
    charge_response: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MidtransChargeResponse(BaseModel):
    payment_id: int
    rental_id: int
    order_id: str
    snap_token: str
    snap_redirect_url: str
    client_key: str
    jumlah: float
    status: PaymentStatusEnum

    class Config:
        from_attributes = True


class PaymentListResponse(BaseModel):
    total: int
    payments: List[PaymentResponse]


class WalletResponse(BaseModel):
    id: int
    admin_id: int
    saldo: float
    total_pendapatan: float
    total_withdrawn: float
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WalletTransactionResponse(BaseModel):
    rental_id: int
    item_nama: str
    jumlah: float
    tanggal: datetime
    penyewa: str


class WithdrawalCreate(BaseModel):
    jumlah: float = Field(..., gt=0, examples=[500000.0])
    bank_name: str = Field(..., min_length=2, max_length=50, examples=["BCA"])
    account_number: str = Field(..., min_length=5, max_length=50, examples=["1234567890"])
    account_holder: str = Field(..., min_length=2, max_length=100, examples=["Toko Sewa Jaya"])
    catatan: Optional[str] = Field(None, examples=["Penarikan bulanan"])


class WithdrawalResponse(BaseModel):
    id: int
    wallet_id: int
    admin_id: int
    jumlah: float
    bank_name: str
    account_number: str
    account_holder: str
    status: WithdrawalStatusEnum
    catatan: Optional[str]
    rejected_reason: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class WithdrawalListResponse(BaseModel):
    total: int
    withdrawals: List[WithdrawalResponse]


class WithdrawalActionByAdmin(BaseModel):
    status: WithdrawalStatusEnum = Field(..., examples=["processing"])
    catatan: Optional[str] = Field(None, examples=["Sedang diproses ke rekening tujuan"])
    rejected_reason: Optional[str] = Field(None, examples=["Nomor rekening tidak valid"])


# Internal API Payloads
class PaymentAutoCreateRequest(BaseModel):
    rental_id: int
    user_id: int
    admin_id: int
    jumlah: float


class WalletCreditRequest(BaseModel):
    admin_id: int
    jumlah: float
    rental_id: int
