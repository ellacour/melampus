from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns a consistent error format:
    {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "...",
            "details": {...}  # optional
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_payload = {
            "error": {
                "code": _get_error_code(response.status_code),
                "message": _extract_message(response.data),
                "details": response.data if isinstance(response.data, dict) else None,
            }
        }
        response.data = error_payload
    else:
        # Unhandled exception — log and return 500
        logger.exception("Unhandled exception", exc_info=exc)
        response = Response(
            {
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Une erreur interne est survenue.",
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response


def _get_error_code(status_code: int) -> str:
    codes = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMITED",
        500: "INTERNAL_SERVER_ERROR",
    }
    return codes.get(status_code, "UNKNOWN_ERROR")


def _extract_message(data) -> str:
    if isinstance(data, dict) and "detail" in data:
        return str(data["detail"])
    if isinstance(data, list) and data:
        return str(data[0])
    return "Une erreur est survenue."
