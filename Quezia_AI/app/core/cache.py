"""
Simple in-memory cache for LLM responses.
Useful for development and reducing redundant API calls.
"""
import hashlib
import json
import threading
from collections import OrderedDict
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from app.core.logging import get_logger

logger = get_logger(__name__)

# Default max cache entries to prevent unbounded memory growth
DEFAULT_MAX_SIZE = 500


class SimpleCache:
    """Thread-safe in-memory LRU cache with TTL support."""

    def __init__(self, ttl_seconds: int = 3600, max_size: int = DEFAULT_MAX_SIZE):
        """
        Initialize cache.

        Args:
            ttl_seconds: Time-to-live for cache entries in seconds
            max_size: Maximum number of entries (oldest evicted first)
        """
        self._cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._ttl_seconds = ttl_seconds
        self._max_size = max_size
        self._lock = threading.Lock()
    
    def _generate_key(self, system_prompt: str, user_prompt: str) -> str:
        """Generate cache key from prompts."""
        combined = f"{system_prompt}|{user_prompt}"
        return hashlib.sha256(combined.encode()).hexdigest()
    
    def get(self, system_prompt: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        """
        Get cached response if available and not expired.
        
        Args:
            system_prompt: System prompt
            user_prompt: User prompt
            
        Returns:
            Cached response or None if not found/expired
        """
        key = self._generate_key(system_prompt, user_prompt)

        with self._lock:
            if key not in self._cache:
                return None

            entry = self._cache[key]
            expiry = entry.get("expiry")

            if expiry and datetime.now() > expiry:
                del self._cache[key]
                logger.debug("cache_expired", key=key[:16])
                return None

            # Move to end (most-recently-used)
            self._cache.move_to_end(key)
            logger.info("cache_hit", key=key[:16])
            return entry.get("response")
    
    def set(self, system_prompt: str, user_prompt: str, response: Dict[str, Any]) -> None:
        """
        Store response in cache.  Evicts oldest entry if at capacity.

        Args:
            system_prompt: System prompt
            user_prompt: User prompt
            response: LLM response to cache
        """
        key = self._generate_key(system_prompt, user_prompt)
        expiry = datetime.now() + timedelta(seconds=self._ttl_seconds)

        with self._lock:
            # If key exists, move to end
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = {
                "response": response,
                "expiry": expiry,
                "created_at": datetime.now(),
            }
            # Evict oldest entries if over capacity
            while len(self._cache) > self._max_size:
                evicted_key, _ = self._cache.popitem(last=False)
                logger.debug("cache_evicted", key=evicted_key[:16])

        logger.debug("cache_set", key=key[:16], ttl_seconds=self._ttl_seconds)
    
    def clear(self) -> None:
        """Clear all cache entries."""
        with self._lock:
            count = len(self._cache)
            self._cache.clear()
        logger.info("cache_cleared", entries_removed=count)
    
    def size(self) -> int:
        """Get number of entries in cache."""
        with self._lock:
            return len(self._cache)
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count removed."""
        now = datetime.now()
        with self._lock:
            expired_keys = [
                key for key, entry in self._cache.items()
                if entry.get("expiry") and now > entry["expiry"]
            ]
            for key in expired_keys:
                del self._cache[key]
        
        if expired_keys:
            logger.info("cache_cleanup", entries_removed=len(expired_keys))
        
        return len(expired_keys)


# Global cache instance (disabled by default)
_cache_instance: Optional[SimpleCache] = None


def get_cache(enable: bool = False, ttl_seconds: int = 3600) -> Optional[SimpleCache]:
    """
    Get cache instance.
    
    Args:
        enable: Whether to enable caching
        ttl_seconds: Cache TTL in seconds
        
    Returns:
        Cache instance or None if disabled
    """
    global _cache_instance
    
    if not enable:
        return None
    
    if _cache_instance is None:
        _cache_instance = SimpleCache(ttl_seconds=ttl_seconds)
        logger.info("cache_initialized", ttl_seconds=ttl_seconds)
    
    return _cache_instance
