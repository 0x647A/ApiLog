"""Small database helpers shared by the routers."""
from __future__ import annotations

from typing import Type, TypeVar

from fastapi import HTTPException
from sqlmodel import Session, SQLModel

T = TypeVar("T", bound=SQLModel)


def get_or_404(session: Session, model: Type[T], obj_id: int, detail: str) -> T:
    """Return the record with this id, or raise 404 with the given message."""
    obj = session.get(model, obj_id)
    if not obj:
        raise HTTPException(status_code=404, detail=detail)
    return obj


def save(session: Session, obj: T) -> T:
    """Add, commit and refresh the record, then return it."""
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def apply_patch(obj: T, data: SQLModel) -> T:
    """Copy the fields that were sent in the request onto the existing record."""
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    return obj
