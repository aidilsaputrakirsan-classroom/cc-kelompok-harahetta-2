"""
Structured Logging Configuration — Sewain Microservices.
Menghasilkan JSON logs yang mudah di-parse oleh log aggregator
(ELK Stack, Grafana Loki, CloudWatch, dll).

Usage:
    from logging_config import setup_logging
    setup_logging()
    logger = logging.getLogger(__name__)
"""
import json
import logging
import sys
import os
from datetime import datetime, timezone


SERVICE_NAME = os.getenv("SERVICE_NAME", "unknown-service")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")


class JSONFormatter(logging.Formatter):
    """Format log record sebagai JSON untuk structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": SERVICE_NAME,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Tambah extra fields jika ada (dari middleware / logger.info(..., extra={...}))
        for field in (
            "correlation_id", "method", "path",
            "status_code", "duration_ms", "user_id", "alert",
        ):
            if hasattr(record, field):
                log_entry[field] = getattr(record, field)

        # Tambah exception info jika ada
        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, ensure_ascii=False)


def setup_logging() -> logging.Logger:
    """
    Setup structured JSON logging untuk service.
    Panggil sekali di startup (main.py / lifespan).
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))

    # Hapus existing handlers (mencegah duplikat saat hot-reload)
    root_logger.handlers.clear()

    # JSON handler ke stdout (Docker mengambil dari stdout)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    root_logger.addHandler(handler)

    # Kurangi noise dari library pihak ketiga
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    return root_logger
