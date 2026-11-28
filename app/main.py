"""
ApiLog: an apiary logbook built with FastAPI.

One process serves both the REST API (/api/...) and the PWA from app/static.

Run with:  uv run apilog   (or: uvicorn app.main:app --host 127.0.0.1 --port 8000)
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .db import init_db
from .routers import alerts, apiaries, hives, inspections, static_pwa
from .security import SecurityHeadersMiddleware

STATIC_DIR = Path(__file__).resolve().parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once on startup: create the tables if they don't exist yet.
    init_db()
    yield


# Swagger UI and ReDoc are off because they load scripts from a CDN, which
# our CSP blocks. The schema is still available at /openapi.json.
app = FastAPI(
    title="ApiLog",
    version="1.1.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(apiaries.router)
app.include_router(hives.router)
app.include_router(inspections.router)
app.include_router(alerts.router)

# PWA files (index.html, service worker, manifest) and other static files
app.include_router(static_pwa.router)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
