"""Application entry point.

Imports the application factory and creates the FastAPI app instance.
This module is the target for ``uvicorn`` and ``gunicorn``.

Usage:
    Development:
        uvicorn main:app --reload --port 8000

    Production (via Docker):
        gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
"""

from core.app_factory import create_app

app = create_app()
