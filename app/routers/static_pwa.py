"""Serves the PWA files: the main page, the service worker and the manifest."""
from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

router = APIRouter(tags=["pwa"])


@router.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")


# The service worker must be served from the root path so it controls the whole app.
@router.get("/sw.js")
def service_worker():
    return FileResponse(STATIC_DIR / "sw.js", media_type="application/javascript")


@router.get("/manifest.json")
def manifest():
    return FileResponse(STATIC_DIR / "manifest.json", media_type="application/manifest+json")
