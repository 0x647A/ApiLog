"""Hive endpoints."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..crud import apply_patch, get_or_404, save
from ..db import get_session
from ..models import Apiary, Hive, Inspection
from ..schemas import HiveIn

router = APIRouter(prefix="/api/hives", tags=["hives"])


def delete_hive_cascade(session: Session, hive: Hive) -> None:
    """Delete a hive and its inspections. Also used by the apiaries router."""
    for insp in session.exec(select(Inspection).where(Inspection.hive_id == hive.id)).all():
        session.delete(insp)
    session.delete(hive)


@router.get("")
def list_hives(apiary_id: Optional[int] = None, session: Session = Depends(get_session)):
    q = select(Hive)
    if apiary_id is not None:
        q = q.where(Hive.apiary_id == apiary_id)
    return session.exec(q).all()


@router.get("/{hive_id}")
def get_hive(hive_id: int, session: Session = Depends(get_session)):
    return get_or_404(session, Hive, hive_id, "Hive not found")


def _require_apiary(session: Session, apiary_id: int) -> None:
    if not session.get(Apiary, apiary_id):
        raise HTTPException(status_code=400, detail="Apiary does not exist")


@router.post("", status_code=201)
def create_hive(data: HiveIn, session: Session = Depends(get_session)):
    _require_apiary(session, data.apiary_id)
    return save(session, Hive(**data.model_dump()))


@router.put("/{hive_id}")
def update_hive(hive_id: int, data: HiveIn, session: Session = Depends(get_session)):
    obj = get_or_404(session, Hive, hive_id, "Hive not found")
    _require_apiary(session, data.apiary_id)
    return save(session, apply_patch(obj, data))


@router.delete("/{hive_id}", status_code=204)
def delete_hive(hive_id: int, session: Session = Depends(get_session)):
    obj = get_or_404(session, Hive, hive_id, "Hive not found")
    delete_hive_cascade(session, obj)
    session.commit()
