"""
Simple In-Memory Metrics Collector.
Mengumpulkan metrics dasar: request count, error count, latency.
Dilengkapi time-windowed error tracking untuk error alerting.
"""
import time
import threading
from collections import defaultdict, deque


# ==============================================
# KONFIGURASI ALERT
# ==============================================
ALERT_ERROR_RATE_THRESHOLD = 10.0   # Persen — trigger alert jika > 10%
ALERT_WINDOW_SECONDS = 60           # Window 1 menit terakhir
ALERT_MIN_REQUESTS = 10             # Minimum request dalam window untuk avoid false positive


class MetricsCollector:
    """Thread-safe metrics collector dengan error alerting."""

    def __init__(self):
        self._lock = threading.Lock()
        self.start_time = time.time()

        # Counters
        self.request_count = 0
        self.error_count = 0          # 4xx + 5xx
        self.status_counts = defaultdict(int)  # per status code

        # Latency tracking (last 1000 requests)
        self.latencies = []
        self.max_latency_samples = 1000

        # Per-endpoint stats
        self.endpoint_stats = defaultdict(lambda: {
            "count": 0,
            "errors": 0,
            "total_latency_ms": 0,
        })

        # =========================================
        # TIME-WINDOWED ERROR TRACKING (untuk alert)
        # =========================================
        # Setiap entry: (timestamp, is_error)
        self._recent_requests = deque()

    def record_request(self, method: str, path: str, status_code: int, duration_ms: float):
        """Catat satu request."""
        now = time.time()
        is_error = status_code >= 400

        with self._lock:
            self.request_count += 1
            self.status_counts[status_code] += 1

            if is_error:
                self.error_count += 1

            # Latency
            self.latencies.append(duration_ms)
            if len(self.latencies) > self.max_latency_samples:
                self.latencies.pop(0)

            # Per-endpoint
            key = f"{method} {path}"
            self.endpoint_stats[key]["count"] += 1
            self.endpoint_stats[key]["total_latency_ms"] += duration_ms
            if is_error:
                self.endpoint_stats[key]["errors"] += 1

            # Time-windowed tracking
            self._recent_requests.append((now, is_error))
            self._prune_old_entries(now)

    def _prune_old_entries(self, now: float):
        """Hapus entries yang lebih tua dari ALERT_WINDOW_SECONDS."""
        cutoff = now - ALERT_WINDOW_SECONDS
        while self._recent_requests and self._recent_requests[0][0] < cutoff:
            self._recent_requests.popleft()

    def get_recent_error_rate(self) -> dict:
        """Hitung error rate dalam window terakhir (60 detik)."""
        now = time.time()
        with self._lock:
            self._prune_old_entries(now)
            total = len(self._recent_requests)
            if total == 0:
                return {
                    "window_seconds": ALERT_WINDOW_SECONDS,
                    "total_requests": 0,
                    "total_errors": 0,
                    "error_rate_percent": 0.0,
                }
            errors = sum(1 for _, is_err in self._recent_requests if is_err)
            return {
                "window_seconds": ALERT_WINDOW_SECONDS,
                "total_requests": total,
                "total_errors": errors,
                "error_rate_percent": round(errors / total * 100, 2),
            }

    def check_alert_condition(self) -> tuple:
        """
        Cek apakah error rate melebihi threshold.
        Returns (should_alert: bool, error_rate: float, details: dict)
        """
        info = self.get_recent_error_rate()
        should_alert = (
            info["total_requests"] >= ALERT_MIN_REQUESTS
            and info["error_rate_percent"] > ALERT_ERROR_RATE_THRESHOLD
        )
        return should_alert, info["error_rate_percent"], info

    def get_metrics(self) -> dict:
        """Return snapshot metrics."""
        with self._lock:
            uptime = round(time.time() - self.start_time, 1)
            error_rate = (
                round(self.error_count / self.request_count * 100, 2)
                if self.request_count > 0 else 0
            )

            # Latency percentiles
            latency_stats = {}
            if self.latencies:
                sorted_lat = sorted(self.latencies)
                n = len(sorted_lat)
                latency_stats = {
                    "p50_ms": round(sorted_lat[int(n * 0.5)], 2),
                    "p95_ms": round(sorted_lat[int(n * 0.95)], 2),
                    "p99_ms": round(sorted_lat[min(int(n * 0.99), n - 1)], 2),
                    "avg_ms": round(sum(sorted_lat) / n, 2),
                }

            # Top endpoints
            endpoints = {}
            for key, stats in self.endpoint_stats.items():
                avg_lat = (
                    round(stats["total_latency_ms"] / stats["count"], 2)
                    if stats["count"] > 0 else 0
                )
                endpoints[key] = {
                    "count": stats["count"],
                    "errors": stats["errors"],
                    "avg_latency_ms": avg_lat,
                }

            return {
                "uptime_seconds": uptime,
                "total_requests": self.request_count,
                "total_errors": self.error_count,
                "error_rate_percent": error_rate,
                "status_codes": dict(self.status_counts),
                "latency": latency_stats,
                "endpoints": endpoints,
            }

    def reset(self):
        """Reset semua metrics."""
        with self._lock:
            self.request_count = 0
            self.error_count = 0
            self.status_counts.clear()
            self.latencies.clear()
            self.endpoint_stats.clear()
            self._recent_requests.clear()


# Singleton instance
metrics = MetricsCollector()
