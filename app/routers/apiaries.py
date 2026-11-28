"""Apiary endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..crud import apply_patch, get_or_404, save
from ..db import get_session
from ..models import Apiary, Hive
from ..schemas import ApiaryIn
from .hives import delete_hive_cascade

router = APIRouter(prefix="/api/apiaries", tags=["apiaries"])


@router.get("")
def list_apiaries(session: Session = Depends(get_session)):
    return session.exec(select(Apiary)).all()


@router.post("", status_code=201)
def create_apiary(data: ApiaryIn, session: Session = Depends(get_session)):
    return save(session, Apiary(**data.model_dump()))


@router.put("/{apiary_id}")
def update_apiary(apiary_id: int, data: ApiaryIn, session: Session = Depends(get_session)):
    obj = get_or_404(session, Apiary, apiary_id, "Apiary not found")
    return save(session, apply_patch(obj, data))


@router.delete("/{apiary_id}", status_code=204)
def delete_apiary(apiary_id: int, session: Session = Depends(get_session)):
    obj = get_or_404(session, Apiary, apiary_id, "Apiary not found")
    # Delete the hives of this apiary (and their inspections) too.
    for hive in session.exec(select(Hive).where(Hive.apiary_id == apiary_id)).all():
        delete_hive_cascade(session, hive)
    session.delete(obj)
    session.commit()
