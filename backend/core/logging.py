"""Structured logging configuration.

Configures structlog with JSON output for production and colored console
output for development. Provides a factory function to get named loggers.
"""

import logging
import sys
from typing import Any

import structlog
from structlog.types import EventDict, Processor

from core.config import get_settings


def _add_app_context(
    logger: Any,  # noqa: ANN401
    method: str,
    event_dict: EventDict,
) -> EventDict:
    """Add application-level context to every log record.

    Args:
        logger: The logger instance (unused but required by structlog protocol).
        method: The log method name (unused but required by structlog protocol).
        event_dict: The current event dictionary to enrich.

    Returns:
        EventDict: The enriched event dictionary.
    """
    settings = get_settings()
    event_dict["app"] = settings.app_name
    event_dict["version"] = settings.app_version
    event_dict["env"] = settings.app_env
    return event_dict


def configure_logging() -> None:
    """Initialize and configure the structlog logging pipeline.

    Sets up either JSON-formatted structured logging (production) or
    pretty-printed console logging (development). This function should
    be called once during application startup.
    """
    settings = get_settings()

    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        _add_app_context,
    ]

    if settings.log_format == "json" or settings.is_production:
        renderer: Processor = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, settings.log_level, logging.INFO))

    # Quiet noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("chromadb").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Return a named structured logger.

    Args:
        name: The logger name, typically the module's ``__name__``.

    Returns:
        structlog.stdlib.BoundLogger: A bound structured logger instance.

    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("Processing request", user_id="123", action="chat")
    """
    return structlog.get_logger(name)
