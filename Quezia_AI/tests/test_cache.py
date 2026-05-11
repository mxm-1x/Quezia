"""Tests for SimpleCache (thread-safety, TTL, LRU eviction)."""
import threading
import time
from datetime import timedelta

from app.core.cache import SimpleCache


def test_cache_set_and_get():
    cache = SimpleCache(ttl_seconds=60, max_size=100)
    cache.set("sys", "user", {"answer": 42})
    assert cache.get("sys", "user") == {"answer": 42}


def test_cache_miss_returns_none():
    cache = SimpleCache()
    assert cache.get("unknown", "prompt") is None


def test_cache_ttl_expiry():
    cache = SimpleCache(ttl_seconds=1, max_size=100)
    cache.set("sys", "user", {"data": 1})
    assert cache.get("sys", "user") is not None
    time.sleep(1.1)
    assert cache.get("sys", "user") is None


def test_cache_lru_eviction():
    cache = SimpleCache(ttl_seconds=60, max_size=3)
    cache.set("s", "u1", {"v": 1})
    cache.set("s", "u2", {"v": 2})
    cache.set("s", "u3", {"v": 3})
    # Cache full, add one more → oldest (u1) evicted
    cache.set("s", "u4", {"v": 4})
    assert cache.get("s", "u1") is None
    assert cache.get("s", "u4") == {"v": 4}
    assert cache.size() == 3


def test_cache_thread_safety():
    """Concurrent writers should not corrupt internal state."""
    cache = SimpleCache(ttl_seconds=60, max_size=500)
    errors = []

    def writer(thread_id: int):
        try:
            for i in range(50):
                cache.set(f"sys-{thread_id}", f"user-{i}", {"t": thread_id, "i": i})
        except Exception as e:
            errors.append(e)

    threads = [threading.Thread(target=writer, args=(t,)) for t in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert not errors
    assert cache.size() <= 500


def test_cache_cleanup_expired():
    cache = SimpleCache(ttl_seconds=1, max_size=100)
    cache.set("s", "u1", {"v": 1})
    cache.set("s", "u2", {"v": 2})
    time.sleep(1.1)
    removed = cache.cleanup_expired()
    assert removed == 2
    assert cache.size() == 0
