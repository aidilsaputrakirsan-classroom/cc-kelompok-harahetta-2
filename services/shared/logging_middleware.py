"""
Request Logging Middleware — Sewain Microservices.
Log setiap HTTP request dengan timing, status code, dan correlation ID.
Juga mengumpulkan metrics via MetricsCollector.

Usage:
    from logging_middleware import RequestLoggingMiddleware
    app.add_middleware(RequestLoggingMiddleware)
"""
import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger(__name__)

# Import metrics collector — optional (tidak crash jika belum ada)
try:
    from metrics import metrics as _metrics_collector
    _HAS_METRICS = True
except ImportError:
    _HAS_METRICS = False

# Path yang tidak perlu di-log (terlalu noisy di production)
_SKIP_LOG_PATHS = {"/health", "/metrics", "/favicon.ico"}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware yang log setiap request/response dengan:
    - Correlation ID (generate jika tidak ada, atau ambil dari header)
    - HTTP method, path, status code
    - Response time (duration_ms)
    - Meneruskan X-Correlation-ID di response header
    """

    async def dispatch(self, request: Request, call_next):
        # ── 1. Ambil / buat Correlation ID ─────────────────────────────
        correlation_id = request.headers.get(
            "X-Correlation-ID",
            str(uuid.uuid4())[:12],
        )
        request.state.correlation_id = correlation_id

        # ── 2. Catat waktu mulai ────────────────────────────────────────
        start_time = time.time()

        # ── 3. Proses request ──────────────────────────────────────────
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled exception: {request.method} {request.url.path}",
                extra={
                    "correlation_id": correlation_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": 500,
                    "duration_ms": duration_ms,
                },
            )
            if _HAS_METRICS:
                _metrics_collector.record_request(
                    request.method, request.url.path, 500, duration_ms
                )
            raise

        # ── 4. Hitung durasi ───────────────────────────────────────────
        duration_ms = round((time.time() - start_time) * 1000, 2)

        # ── 5. Catat metrics (semua request) ────────────────────────────
        if _HAS_METRICS:
            _metrics_collector.record_request(
                request.method, request.url.path,
                response.status_code, duration_ms,
            )

        # ── 6. Log request (skip noise paths) ──────────────────────────
        if request.url.path not in _SKIP_LOG_PATHS:
            log_level = (
                logging.WARNING if response.status_code >= 400
                else logging.INFO
            )
            logger.log(
                log_level,
                f"{request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)",
                extra={
                    "correlation_id": correlation_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            )

        # ── 7. Teruskan Correlation ID ke response header ──────────────
        response.headers["X-Correlation-ID"] = correlation_id
        return response
