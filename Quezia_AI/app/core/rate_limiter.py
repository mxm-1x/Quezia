"""
Simple rate limiter for LLM API calls.
Prevents excessive API usage and manages token budgets.
"""
import time
from collections import deque
from typing import Optional
from datetime import datetime, timedelta

from app.core.logging import get_logger

logger = get_logger(__name__)


class RateLimiter:
    """Simple sliding window rate limiter."""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        """
        Initialize rate limiter.
        
        Args:
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
        """
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._requests: deque = deque()
    
    def _clean_old_requests(self) -> None:
        """Remove requests outside the current window."""
        cutoff = time.time() - self._window_seconds
        
        while self._requests and self._requests[0] < cutoff:
            self._requests.popleft()
    
    def acquire(self, timeout: Optional[float] = None) -> bool:
        """
        Try to acquire permission for a request.
        
        Args:
            timeout: Max seconds to wait for permission (None = no wait)
            
        Returns:
            True if acquired, False if timed out
        """
        start_time = time.time()
        
        while True:
            self._clean_old_requests()
            
            if len(self._requests) < self._max_requests:
                self._requests.append(time.time())
                logger.debug(
                    "rate_limit_acquired",
                    current_count=len(self._requests),
                    max_requests=self._max_requests
                )
                return True
            
            if timeout is None:
                logger.warning(
                    "rate_limit_exceeded",
                    current_count=len(self._requests),
                    max_requests=self._max_requests,
                    window_seconds=self._window_seconds
                )
                return False
            
            elapsed = time.time() - start_time
            if elapsed >= timeout:
                logger.error("rate_limit_timeout", timeout_seconds=timeout)
                return False
            
            # Wait a bit before retrying
            sleep_time = min(0.1, timeout - elapsed)
            time.sleep(sleep_time)
    
    def get_current_usage(self) -> dict:
        """Get current rate limit usage statistics."""
        self._clean_old_requests()
        
        return {
            "current_requests": len(self._requests),
            "max_requests": self._max_requests,
            "window_seconds": self._window_seconds,
            "usage_percentage": (len(self._requests) / self._max_requests) * 100,
            "available_requests": self._max_requests - len(self._requests)
        }
    
    def reset(self) -> None:
        """Reset the rate limiter."""
        count = len(self._requests)
        self._requests.clear()
        logger.info("rate_limiter_reset", requests_cleared=count)


# Global rate limiter instance (disabled by default)
_rate_limiter_instance: Optional[RateLimiter] = None


def get_rate_limiter(
    enable: bool = False,
    max_requests: int = 100,
    window_seconds: int = 60
) -> Optional[RateLimiter]:
    """
    Get rate limiter instance.
    
    Args:
        enable: Whether to enable rate limiting
        max_requests: Max requests per window
        window_seconds: Window size in seconds
        
    Returns:
        RateLimiter instance or None if disabled
    """
    global _rate_limiter_instance
    
    if not enable:
        return None
    
    if _rate_limiter_instance is None:
        _rate_limiter_instance = RateLimiter(
            max_requests=max_requests,
            window_seconds=window_seconds
        )
        logger.info(
            "rate_limiter_initialized",
            max_requests=max_requests,
            window_seconds=window_seconds
        )
    
    return _rate_limiter_instance
