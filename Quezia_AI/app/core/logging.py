"""
Structured logging for debuggability.
"""
import structlog
import logging
import sys
from typing import Any, Dict


def configure_logging(log_level: str = "INFO") -> None:
    """Configure structured logging for the application."""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


def log_agent_io(
    logger: structlog.stdlib.BoundLogger,
    agent_name: str,
    state: Dict[str, Any],
    output: Dict[str, Any],
    error: Exception = None
) -> None:
    """Log agent inputs and outputs for debugging."""
    log_data = {
        "agent": agent_name,
        "input_keys": list(state.keys()),
        "output_keys": list(output.keys()),
    }
    
    if error:
        log_data["error"] = str(error)
        log_data["error_type"] = type(error).__name__
        logger.error("agent_execution_failed", **log_data)
    else:
        logger.info("agent_execution_success", **log_data)
