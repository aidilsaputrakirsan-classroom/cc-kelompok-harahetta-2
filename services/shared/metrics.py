"""
Simple In-Memory Metrics Collector — Sewain Microservices.
Mengumpulkan metrics dasar: request count, error count, latency percentiles.

Digunakan oleh RequestLoggingMiddleware secara otomatis.
Expose via endpoint /metrics di masing-masing service.

Usage:
    from metrics import metrics

    # Di endpoint /metrics
    @app.get("/metrics")
    def get_metrics():
        return {"service": SERVICE_NAME, **metrics.get_metrics()}
"""
import time
import threading
from collections import defaultdict


class MetricsCollector:
    """
    Thread-safe in-memory metrics collector.

    Mengumpulkan:
    - Total requests & errors
    - Per-status-code count
    - Latency percentiles (p50, p95, p99) dari 1000 sample terakhir
    - Per-endpoint stats (count, errors, avg latency)
    """

    def __init__(self, max_latency_samples: int = 1000):
        self._lock = threading.Lock()
        self.start_time = time.time()
        self.max_latency_samples = max_latency_samples

        # Counters
        self.request_count: int = 0
        self.error_count: int = 0                      # HTTP 4xx + 5xx
        self.status_counts: dict = defaultdict(int)    # {"200": 5, "404": 1, ...}

        # Latency ring-buffer (rolling window, last N samples)
        self.latencies: list = []

        # Per-endpoint stats
        self.endpoint_stats: dict = defaultdict(lambda: {
            "count": 0,
            "errors": 0,
            "total_latency_ms": 0.0,
        })

    # ──────────────────────────────────────────────────────────────
    # Recording
    # ──────────────────────────────────────────────────────────────

    def record_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration_ms: float,
    ) -> None:
        """Catat satu request. Thread-safe."""
        with self._lock:
            self.request_count += 1
            self.status_counts[str(status_code)] += 1

            if status_code >= 400:
                self.error_count += 1

            # Latency ring-buffer
            self.latencies.append(duration_ms)
            if len(self.latencies) > self.max_latency_samples:
                self.latencies.pop(0)

            # Per-endpoint
            key = f"{method} {path}"
            self.endpoint_stats[key]["count"] += 1
            self.endpoint_stats[key]["total_latency_ms"] += duration_ms
            if status_code >= 400:
                self.endpoint_stats[key]["errors"] += 1

    # ──────────────────────────────────────────────────────────────
    # Reporting
    # ──────────────────────────────────────────────────────────────

    def get_metrics(self) -> dict:
        """Return snapshot metrics (thread-safe copy)."""
        with self._lock:
            uptime = round(time.time() - self.start_time, 1)
            error_rate = (
                round(self.error_count / self.request_count * 100, 2)
                if self.request_count > 0
                else 0.0
            )

            # Latency percentiles
            latency_stats: dict = {}
            if self.latencies:
                sorted_lat = sorted(self.latencies)
                n = len(sorted_lat)
                latency_stats = {
                    "p50_ms":  round(sorted_lat[int(n * 0.50)], 2),
                    "p95_ms":  round(sorted_lat[min(int(n * 0.95), n - 1)], 2),
                    "p99_ms":  round(sorted_lat[min(int(n * 0.99), n - 1)], 2),
                    "avg_ms":  round(sum(sorted_lat) / n, 2),
                    "min_ms":  round(sorted_lat[0], 2),
                    "max_ms":  round(sorted_lat[-1], 2),
                    "samples": n,
                }

            # Per-endpoint summary
            endpoints: dict = {}
            for key, stats in self.endpoint_stats.items():
                avg_lat = (
                    round(stats["total_latency_ms"] / stats["count"], 2)
                    if stats["count"] > 0
                    else 0.0
                )
                endpoints[key] = {
                    "count":           stats["count"],
                    "errors":          stats["errors"],
                    "avg_latency_ms":  avg_lat,
                }

            return {
                "uptime_seconds":     uptime,
                "total_requests":     self.request_count,
                "total_errors":       self.error_count,
                "error_rate_percent": error_rate,
                "status_codes":       dict(self.status_counts),
                "latency":            latency_stats,
                "endpoints":          endpoints,
            }

    def reset(self) -> None:
        """Reset semua metrics (gunakan hati-hati di production)."""
        with self._lock:
            self.request_count = 0
            self.error_count = 0
            self.status_counts.clear()
            self.latencies.clear()
            self.endpoint_stats.clear()
            self.start_time = time.time()


# ── Singleton global instance ──────────────────────────────────────
# Diimport oleh logging_middleware dan endpoint /metrics
metrics = MetricsCollector()
