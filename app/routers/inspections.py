"""Inspection endpoints."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from ..crud import get_or_404, save
from ..db import get_session
from ..models import Hive, Inspection
from ..schemas import InspectionIn

router = APIRouter(prefix="/api/inspections", tags=["inspections"])


@router.get("")
def list_inspections(hive_id: Optional[int] = None, session: Session = Depends(get_session)):
    q = select(Inspection).order_by(Inspection.date.desc(), Inspection.id.desc())
    if hive_id is not None:
        q = q.where(Inspection.hive_id == hive_id)
    return session.exec(q).all()


@router.post("", status_code=201)
def create_inspection(data: InspectionIn, session: Session = Depends(get_session)):
    if not session.get(Hive, data.hive_id):
        raise HTTPException(status_code=400, detail="Hive does not exist")
    # Offline sync can send the same inspection twice. If one with this
    # client_uuid already exists, return it instead of creating a duplicate.
    if data.client_uuid:
        existing = _find_by_uuid(session, data.client_uuid)
        if existing:
            return existing
    try:
        return save(session, Inspection(**data.model_dump(exclude_none=True)))
    except IntegrityError:
        # Two requests with the same inspection arrived at the same time and
        # the second one hit the unique client_uuid. Return the saved one.
        session.rollback()
        existing = _find_by_uuid(session, data.client_uuid) if data.client_uuid else None
        if existing is None:
            raise
        return existing


def _find_by_uuid(session: Session, client_uuid: str) -> Optional[Inspection]:
    return session.exec(
        select(Inspection).where(Inspection.client_uuid == client_uuid)
    ).first()


@router.delete("/{inspection_id}", status_code=204)
def delete_inspection(inspection_id: int, session: Session = Depends(get_session)):
    obj = get_or_404(session, Inspection, inspection_id, "Inspection not found")
    session.delete(obj)
    session.commit()
