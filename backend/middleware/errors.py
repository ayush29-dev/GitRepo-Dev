"""
Global error handler middleware.
Catches unhandled exceptions → returns clean JSON instead of 500 stack trace.
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger("gitrepo-dev")


async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Pydantic validation errors → readable 422 response."""
    errors = [
        {
            "field": " → ".join(str(l) for l in e["loc"]),
            "message": e["msg"],
        }
        for e in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": "Validation error", "errors": errors})


async def general_error_handler(request: Request, exc: Exception):
    """Unhandled exceptions → clean 500, log full traceback."""
    logger.exception(f"Unhandled error on {request.method} {request.url}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check backend logs."},
    )
