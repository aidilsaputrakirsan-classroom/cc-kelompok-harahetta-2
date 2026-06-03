"""
normalize_promos_to_percentage.py
Sistem promo sekarang hanya memakai tipe PERSENTASE.
Script ini mengubah semua promo bertipe 'fixed' menjadi 'percentage'.
Jika discount_value di luar rentang 1-100 (karena dulu nominal Rp),
nilainya di-clamp ke 50 sebagai default yang aman.

Jalankan: python normalize_promos_to_percentage.py
"""
from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal
from models import PromoCode, DiscountType

db = SessionLocal()
try:
    promos = db.query(PromoCode).filter(PromoCode.discount_type == DiscountType.fixed).all()
    if not promos:
        print("✅ Tidak ada promo bertipe 'fixed'. Semua sudah percentage.")
    for p in promos:
        old_val = p.discount_value
        p.discount_type = DiscountType.percentage
        # Nominal Rp tidak valid sebagai persen → clamp ke 1-100
        if p.discount_value is None or p.discount_value <= 0 or p.discount_value > 100:
            p.discount_value = 50.0
        print(f"  • #{p.id} {p.code}: fixed({old_val}) → percentage({p.discount_value}%)")
    db.commit()
    print("🎉 Selesai. Semua promo kini bertipe percentage.")
finally:
    db.close()
