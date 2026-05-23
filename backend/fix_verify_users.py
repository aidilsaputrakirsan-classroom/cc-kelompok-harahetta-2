"""
fix_verify_users.py — Set email_verified_at untuk semua user yang belum verified
Jalankan: python fix_verify_users.py
"""

from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

from database import engine, SessionLocal, Base
from models import User

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    users = db.query(User).filter(User.email_verified_at.is_(None)).all()
    
    if not users:
        print("✅ Semua user sudah terverifikasi.")
    else:
        for user in users:
            user.email_verified_at = datetime.now(timezone.utc)
            print(f"✅ Verified: {user.email}")
        db.commit()
        print(f"\n🎉 {len(users)} user berhasil diverifikasi!")

except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
finally:
    db.close()
