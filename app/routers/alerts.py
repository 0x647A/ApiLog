"""Alerts endpoint. The rules are in alerts_engine.py."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..alerts_engine import compute_alerts
from ..db import get_session

router = APIRouter(prefix="/api", tags=["alerts"])


@router.get("/alerts")
def alerts(session: Session = Depends(get_session)):
    return compute_alerts(session)
