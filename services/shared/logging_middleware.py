"""
Request Logging Middleware.
Log setiap HTTP request dengan timing, status, dan correlation ID.
Dilengkapi error alerting: log CRITICAL jika error rate > 10% dalam 1 menit.
"""
import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from metrics import metrics

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware yang log setiap request/response + error alerting."""

    async def dispatch(self, request: Request, call_next):
        # Generate atau ambil correlation ID
        correlation_id = request.headers.get(
            "X-Correlation-ID",
            str(uuid.uuid4())[:12]
        )

        # Simpan di request state (bisa diakses di endpoint)
        request.state.correlation_id = correlation_id

        # Catat waktu mulai
        start_time = time.time()

        # Proses request
        try:
            response = await call_next(request)
        except Exception as e:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            # Record failed request di metrics
            metrics.record_request(request.method, request.url.path, 500, duration_ms)
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "correlation_id": correlation_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "status_code": 500,
                },
            )
            # Cek alert condition setelah error
            self._check_and_log_alert(correlation_id)
            raise

        # Hitung durasi
        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Record metrics (semua request, termasuk health)
        metrics.record_request(
            request.method, request.url.path,
            response.status_code, duration_ms
        )

        # Log request (skip health checks dan metrics agar log tidak terlalu noisy)
        if request.url.path not in ["/health", "/metrics"]:
            log_level = logging.WARNING if response.status_code >= 400 else logging.INFO
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

        # =============================================
        # ERROR ALERTING — Lead Backend Task
        # Cek apakah error rate > 10% dalam 1 menit
        # =============================================
        if response.status_code >= 400:
            self._check_and_log_alert(correlation_id)

        # Teruskan correlation ID di response header
        response.headers["X-Correlation-ID"] = correlation_id
        return response

    def _check_and_log_alert(self, correlation_id: str):
        """
        Cek error rate dan log CRITICAL jika melebihi threshold.
        Alert field ditambahkan agar bisa di-pick up oleh log aggregator.
        """
        should_alert, error_rate, info = metrics.check_alert_condition()
        if should_alert:
            logger.critical(
                f"HIGH ERROR RATE ALERT: {error_rate}% errors in last "
                f"{info['window_seconds']}s (threshold: 10%) — "
                f"{info['total_errors']}/{info['total_requests']} requests failed",
                extra={
                    "correlation_id": correlation_id,
                    "alert": True,
                    "error_rate": error_rate,
                },
            )
