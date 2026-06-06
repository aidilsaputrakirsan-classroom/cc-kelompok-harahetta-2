"""
Circuit Breaker — mencegah cascading failure.
Jika Auth Service gagal berkali-kali, berhenti mencoba (fail fast).
"""
import time
import logging

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """
    Simple circuit breaker implementation.

    States:
    - CLOSED:    Normal. Requests diteruskan.
    - OPEN:      Tripped. Requests langsung ditolak (fail fast).
    - HALF_OPEN: Testing. 1 request diizinkan untuk test recovery.
    """

    def __init__(
        self,
        name: str = "default",
        failure_threshold: int = 5,
        cooldown_seconds: int = 30,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.failure_count = 0
        self.success_count = 0
        self.state = "CLOSED"
        self.last_failure_time = None
        self.total_rejected = 0

    def can_execute(self) -> bool:
        """Periksa apakah request boleh diteruskan."""
        if self.state == "CLOSED":
            return True

        if self.state == "OPEN":
            elapsed = time.time() - self.last_failure_time
            if elapsed >= self.cooldown_seconds:
                logger.info(
                    f"[CircuitBreaker:{self.name}] "
                    f"Cooldown selesai ({self.cooldown_seconds}s). "
                    f"State: OPEN → HALF_OPEN"
                )
                self.state = "HALF_OPEN"
                return True
            else:
                self.total_rejected += 1
                remaining = int(self.cooldown_seconds - elapsed)
                logger.debug(
                    f"[CircuitBreaker:{self.name}] "
                    f"OPEN — request ditolak. "
                    f"Cooldown remaining: {remaining}s"
                )
                return False

        # HALF_OPEN — izinkan untuk test
        return True

    def record_success(self):
        """Catat keberhasilan."""
        if self.state == "HALF_OPEN":
            logger.info(
                f"[CircuitBreaker:{self.name}] "
                f"Test berhasil! State: HALF_OPEN → CLOSED"
            )
        self.failure_count = 0
        self.success_count += 1
        self.state = "CLOSED"

    def record_failure(self):
        """Catat kegagalan."""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.state == "HALF_OPEN":
            logger.warning(
                f"[CircuitBreaker:{self.name}] "
                f"Test gagal. State: HALF_OPEN → OPEN"
            )
            self.state = "OPEN"
        elif self.failure_count >= self.failure_threshold:
            logger.error(
                f"[CircuitBreaker:{self.name}] "
                f"Threshold tercapai ({self.failure_count}/{self.failure_threshold}). "
                f"State: CLOSED → OPEN"
            )
            self.state = "OPEN"

    def get_status(self) -> dict:
        """Return status circuit breaker untuk health check."""
        return {
            "name": self.name,
            "state": self.state,
            "failure_count": self.failure_count,
            "failure_threshold": self.failure_threshold,
            "total_rejected": self.total_rejected,
            "cooldown_seconds": self.cooldown_seconds,
        }
