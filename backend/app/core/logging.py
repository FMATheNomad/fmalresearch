import structlog
import logging
import sys


def setup_logging(environment: str = "development"):
    timestamper = structlog.processors.TimeStamper(fmt="iso")

    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        timestamper,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if environment == "development":
        log_renderer = structlog.dev.ConsoleRenderer()
    else:
        log_renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=shared_processors + [log_renderer],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(structlog.stdlib.ProcessorFormatter(
        processor=structlog.dev.ConsoleRenderer() if environment == "development"
        else structlog.processors.JSONRenderer(),
    ))
    root_logger.addHandler(handler)

    for lib in ["uvicorn", "sqlalchemy", "httpx"]:
        logging.getLogger(lib).setLevel(logging.WARNING)


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name or __name__)
