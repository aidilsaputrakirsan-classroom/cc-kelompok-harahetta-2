"""
config.py — Konfigurasi Terpusat Aplikasi Sewain
=================================================
Membaca semua environment variables dengan fallback default values.
Tidak akan crash jika env var tidak ada — selalu punya nilai default.

Cara pakai di file lain:
    from config import settings

    print(settings.DEBUG)          # True/False
    print(settings.DATABASE_URL)   # URL database
    print(settings.CORS_ORIGINS)   # List of allowed origins
"""

import os
import logging
from dotenv import load_dotenv

# Load .env file jika ada (development). Di production (Railway), env vars
# sudah di-set di dashboard — load_dotenv() aman dipanggil, tidak akan
# menimpa env vars yang sudah ada di system.
load_dotenv(override=False)


class Settings:
    """
    Konfigurasi aplikasi — dibaca dari environment variables.

    Urutan prioritas:
    1. Environment variables dari sistem/Railway (production)
    2. File .env (development lokal)
    3. Default value di bawah (fallback aman)
    """

    # ------------------------------------------------------------------
    # ENVIRONMENT
    # ------------------------------------------------------------------
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # True jika mode development, False jika production
    IS_PRODUCTION: bool = ENVIRONMENT == "production"
    DEBUG: bool = not IS_PRODUCTION

    # ------------------------------------------------------------------
    # DATABASE
    # ------------------------------------------------------------------
    # Development default: SQLite lokal
    # Production: isi dengan PostgreSQL URL dari Railway (env var)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./sewain.db"
    )

    # ------------------------------------------------------------------
    # AUTENTIKASI & JWT
    # ------------------------------------------------------------------
    # PENTING: Di production, set SECRET_KEY ke string random yang panjang.
    # Generate: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "dev-secret-key-GANTI-DI-PRODUCTION-minimum-32-karakter-panjangnya"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # ------------------------------------------------------------------
    # CORS (Cross-Origin Resource Sharing)
    # ------------------------------------------------------------------
    # Development: izinkan localhost untuk Vite dev server
    # Production: isi dengan URL frontend Railway (env var CORS_ORIGINS)
    _cors_raw: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://localhost:5174"
    )
    # Pecah menjadi list, trim whitespace di setiap origin
    CORS_ORIGINS: list = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]

    # ------------------------------------------------------------------
    # LOGGING
    # ------------------------------------------------------------------
    # Development: DEBUG (verbose). Production: INFO (lebih bersih)
    LOG_LEVEL: str = os.getenv(
        "LOG_LEVEL",
        "DEBUG" if DEBUG else "INFO"
    )

    # ------------------------------------------------------------------
    # APLIKASI
    # ------------------------------------------------------------------
    APP_NAME: str = "Sewain API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = (
        "Platform Sewa Barang Online. "
        "Gunakan POST /auth/login untuk login dan dapatkan token."
    )

    # ------------------------------------------------------------------
    # EMAIL SERVICE
    # ------------------------------------------------------------------
    # Untuk fitur kirim email verifikasi & reset password
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "noreply@sewain.app")
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))

    # ------------------------------------------------------------------
    # MIDTRANS PAYMENT GATEWAY
    # ------------------------------------------------------------------
    MIDTRANS_SERVER_KEY: str = os.getenv("MIDTRANS_SERVER_KEY", "")
    MIDTRANS_CLIENT_KEY: str = os.getenv("MIDTRANS_CLIENT_KEY", "")
    MIDTRANS_IS_PRODUCTION: bool = os.getenv("MIDTRANS_IS_PRODUCTION", "false").lower() == "true"

    def __repr__(self) -> str:
        """Representasi settings yang aman — tidak menampilkan secrets."""
        return (
            f"Settings("
            f"ENVIRONMENT={self.ENVIRONMENT!r}, "
            f"DEBUG={self.DEBUG}, "
            f"DATABASE_URL={'[SQLite]' if 'sqlite' in self.DATABASE_URL else '[PostgreSQL]'}, "
            f"CORS_ORIGINS={self.CORS_ORIGINS}, "
            f"LOG_LEVEL={self.LOG_LEVEL!r}"
            f")"
        )

    def validate(self) -> None:
        """
        Validasi settings saat startup.
        Di production, peringatkan jika masih pakai nilai default yang tidak aman.
        Tidak akan crash — hanya log warning.
        """
        if self.IS_PRODUCTION:
            if "dev-secret-key" in self.SECRET_KEY:
                logging.warning(
                    "⚠️  [CONFIG] SECRET_KEY masih pakai nilai default! "
                    "Set env var SECRET_KEY di Railway untuk keamanan production."
                )
            if "sqlite" in self.DATABASE_URL:
                logging.warning(
                    "⚠️  [CONFIG] DATABASE_URL masih pakai SQLite di production! "
                    "Set env var DATABASE_URL ke PostgreSQL Railway."
                )
            if "localhost" in str(self.CORS_ORIGINS):
                logging.warning(
                    "⚠️  [CONFIG] CORS_ORIGINS masih mengandung localhost di production! "
                    "Set env var CORS_ORIGINS ke URL frontend Railway."
                )


# Singleton — satu instance dipakai di seluruh aplikasi
settings = Settings()

# Setup logging level berdasarkan config
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# Log info environment saat startup (aman, tidak ada secrets)
logger = logging.getLogger(__name__)
logger.info(f"🚀 Config loaded: {settings!r}")
