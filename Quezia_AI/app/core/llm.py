"""
LLM wrapper using LangChain.
All LLM calls go through this module.

Supports both synchronous and asynchronous invocation:
- invoke(): Synchronous call (blocking)
- ainvoke(): Asynchronous call (non-blocking, for concurrent operations)
"""
from typing import Dict, Any, Optional, List
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
import json
import re
import time
import asyncio
import os

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Import cache and rate limiter (lazy imports to avoid circular deps)
_cache = None
_rate_limiter = None
_async_semaphore = None  # For limiting concurrent async calls


def _get_cache():
    """Lazy load cache."""
    global _cache
    if _cache is None:
        from app.core.cache import get_cache
        enable_cache = os.getenv("ENABLE_CACHE", "false").lower() == "true"
        _cache = get_cache(enable=enable_cache, ttl_seconds=3600)
    return _cache


def _get_rate_limiter():
    """Lazy load rate limiter."""
    global _rate_limiter
    if _rate_limiter is None:
        from app.core.rate_limiter import get_rate_limiter
        enable_rl = os.getenv("ENABLE_RATE_LIMIT", "false").lower() == "true"
        max_req = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", "100"))
        window = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
        _rate_limiter = get_rate_limiter(enable=enable_rl, max_requests=max_req, window_seconds=window)
    return _rate_limiter


def _get_async_semaphore(max_concurrent: int = 10) -> asyncio.Semaphore:
    """Get or create async semaphore for limiting concurrent LLM calls."""
    global _async_semaphore
    if _async_semaphore is None:
        _async_semaphore = asyncio.Semaphore(max_concurrent)
    return _async_semaphore


class LLMWrapper:
    """
    Wrapper for LLM interactions with consistent configuration.
    
    Supports both sync and async operations:
    - invoke(): For single calls or when blocking is acceptable
    - ainvoke(): For concurrent operations (test generation, batch processing)
    - abatch(): For processing multiple prompts concurrently
    """
    
    def __init__(self):
        provider = settings.LLM_PROVIDER.lower()
        
        def create_llm(model_name):
            if provider == "openrouter" and settings.OPENROUTER_API_KEY:
                return ChatOpenAI(
                    model=model_name,
                    temperature=settings.LLM_TEMPERATURE,
                    max_tokens=settings.LLM_MAX_TOKENS,
                    api_key=settings.OPENROUTER_API_KEY,
                    base_url="https://openrouter.ai/api/v1",
                    default_headers={
                        "HTTP-Referer": "https://quezia.ai",
                        "X-Title": "Quezia AI Service",
                    },
                )
            elif provider == "groq" and settings.GROQ_API_KEY:
                return ChatGroq(
                    model_name=model_name,
                    temperature=settings.LLM_TEMPERATURE,
                    max_tokens=settings.LLM_MAX_TOKENS,
                    api_key=settings.GROQ_API_KEY,
                )
            else:
                return ChatOpenAI(
                    model=model_name,
                    temperature=settings.LLM_TEMPERATURE,
                    max_tokens=settings.LLM_MAX_TOKENS,
                    api_key=settings.OPENAI_API_KEY,
                )

        self.llms = {
            "fast": create_llm(settings.LLM_MODEL_FAST),
            "medium": create_llm(settings.LLM_MODEL_MEDIUM),
            "complex": create_llm(settings.LLM_MODEL_COMPLEX)
        }
        
        logger.info("llm_initialized", provider=provider, fast=settings.LLM_MODEL_FAST, medium=settings.LLM_MODEL_MEDIUM, complex=settings.LLM_MODEL_COMPLEX)
        
        # Max concurrent async calls (to avoid rate limits)
        self.max_concurrent = settings.LLM_MAX_CONCURRENT
    
    def invoke(
        self,
        system_prompt: str,
        user_prompt: str,
        expect_json: bool = True,
        max_retries: int = 3,
        tier: str = "fast"
    ) -> Dict[str, Any]:
        """
        Invoke LLM with structured prompts and automatic retry on failure.
        
        Args:
            system_prompt: System instructions
            user_prompt: User query/content
            expect_json: Whether to parse response as JSON
            max_retries: Maximum number of retry attempts
            
        Returns:
            Parsed response (dict if expect_json=True, else string)
        """
        # Check cache first
        cache = _get_cache()
        if cache:
            cached_response = cache.get(system_prompt, user_prompt)
            if cached_response:
                return cached_response
        
        # Check rate limiter
        rate_limiter = _get_rate_limiter()
        if rate_limiter:
            if not rate_limiter.acquire(timeout=5.0):
                raise Exception("Rate limit exceeded. Please try again later.")
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        logger.info(
            "llm_invocation",
            system_prompt_length=len(system_prompt),
            user_prompt_length=len(user_prompt),
            expect_json=expect_json
        )
        
        last_error = None
        for attempt in range(max_retries):
            try:
                response = self.llms[tier].invoke(messages)
                content = response.content
                
                if expect_json:
                    result = self._extract_json(content)
                else:
                    result = {"content": content}
                
                # Cache successful response
                if cache:
                    cache.set(system_prompt, user_prompt, result)
                
                return result
                
            except json.JSONDecodeError as e:
                last_error = e
                logger.warning(
                    "llm_json_parse_failed",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    error=str(e)
                )
                if attempt < max_retries - 1:
                    time.sleep(settings.RETRY_DELAY * (attempt + 1))
                    continue
                    
            except Exception as e:
                last_error = e
                logger.warning(
                    "llm_invocation_retry",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    error=str(e)
                )
                if attempt < max_retries - 1:
                    time.sleep(settings.RETRY_DELAY * (attempt + 1))
                    continue
        
        logger.error("llm_invocation_failed_after_retries", error=str(last_error))
        if last_error is None:
            raise RuntimeError("LLM invocation failed after retries (no error captured)")
        raise last_error
    
    async def ainvoke(
        self,
        system_prompt: str,
        user_prompt: str,
        expect_json: bool = True,
        max_retries: int = 3,
        tier: str = "fast"
    ) -> Dict[str, Any]:
        """
        Async invoke LLM with structured prompts and automatic retry on failure.
        
        Use this for concurrent operations like batch question generation.
        
        Args:
            system_prompt: System instructions
            user_prompt: User query/content
            expect_json: Whether to parse response as JSON
            max_retries: Maximum number of retry attempts
            
        Returns:
            Parsed response (dict if expect_json=True, else string)
        """
        # Check cache first
        cache = _get_cache()
        if cache:
            cached_response = cache.get(system_prompt, user_prompt)
            if cached_response:
                return cached_response
        
        # Use semaphore to limit concurrent calls
        semaphore = _get_async_semaphore(self.max_concurrent)
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        logger.info(
            "llm_async_invocation",
            system_prompt_length=len(system_prompt),
            user_prompt_length=len(user_prompt),
            expect_json=expect_json
        )
        
        last_error = None
        for attempt in range(max_retries):
            try:
                async with semaphore:
                    response = await self.llms[tier].ainvoke(messages)
                content = response.content
                
                if expect_json:
                    result = self._extract_json(content)
                else:
                    result = {"content": content}
                
                # Cache successful response
                if cache:
                    cache.set(system_prompt, user_prompt, result)
                
                return result
                
            except json.JSONDecodeError as e:
                last_error = e
                logger.warning(
                    "llm_async_json_parse_failed",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    error=str(e)
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(settings.RETRY_DELAY * (attempt + 1))
                    continue
                    
            except Exception as e:
                last_error = e
                logger.warning(
                    "llm_async_invocation_retry",
                    attempt=attempt + 1,
                    max_retries=max_retries,
                    error=str(e)
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(settings.RETRY_DELAY * (attempt + 1))
                    continue
        
        logger.error("llm_async_invocation_failed_after_retries", error=str(last_error))
        if last_error is None:
            raise RuntimeError("Async LLM invocation failed after retries (no error captured)")
        raise last_error
    
    async def abatch(
        self,
        prompts: List[tuple],
        expect_json: bool = True,
        max_retries: int = 3,
        tier: str = "fast"
    ) -> List[Dict[str, Any]]:
        """
        Process multiple prompts concurrently.
        
        Args:
            prompts: List of (system_prompt, user_prompt) or (system_prompt, user_prompt, expect_json) tuples
            expect_json: Default value for expect_json if not specified in tuple
            max_retries: Maximum number of retry attempts per prompt
            
        Returns:
            List of parsed responses in the same order as input prompts
            
        Example:
            prompts = [
                ("Generate a physics question...", "Topic: Kinematics"),
                ("Generate a math question...", "Topic: Calculus", False),
            ]
            results = await llm.abatch(prompts)
        """
        logger.info("llm_batch_invocation", batch_size=len(prompts))
        
        tasks = []
        for prompt_tuple in prompts:
            if len(prompt_tuple) == 3:
                system_prompt, user_prompt, prompt_expect_json = prompt_tuple
            else:
                system_prompt, user_prompt = prompt_tuple
                prompt_expect_json = expect_json
            
            tasks.append(
                self.ainvoke(system_prompt, user_prompt, prompt_expect_json, max_retries, tier)
            )
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Log any failures
        failures = sum(1 for r in results if isinstance(r, Exception))
        if failures:
            logger.warning("llm_batch_partial_failure", failures=failures, total=len(prompts))
        
        return results

    def _extract_json(self, content: str) -> Dict[str, Any]:
        """Extract JSON from LLM response, handling various formats."""
        # 1. Try direct JSON parsing
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass

        # 2. Try extracting from markdown code blocks
        for pattern in [r'```json\s*(.*?)\s*```', r'```\s*(.*?)\s*```']:
            matches = re.findall(pattern, content, re.DOTALL)
            for match in matches:
                try:
                    return json.loads(match.strip())
                except json.JSONDecodeError:
                    continue

        # 3. Find every '{' and attempt json.loads from that offset
        #    (handles nested braces correctly, unlike regex)
        for i, ch in enumerate(content):
            if ch == '{':
                try:
                    obj, _ = json.JSONDecoder().raw_decode(content, i)
                    if isinstance(obj, dict):
                        return obj
                except json.JSONDecodeError:
                    continue

        logger.error("json_extraction_failed", content=content[:200])
        raise ValueError(f"Could not extract valid JSON from LLM response: {content[:200]}")


# Lazy singleton instance
_llm_wrapper: Optional[LLMWrapper] = None


def get_llm() -> LLMWrapper:
    """Get the LLM wrapper instance (created on first call)."""
    global _llm_wrapper
    if _llm_wrapper is None:
        _llm_wrapper = LLMWrapper()
    return _llm_wrapper
