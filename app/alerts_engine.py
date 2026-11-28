"""
Alert rules.

For every active hive we look at the latest inspection and return the things
the beekeeper should check. Each alert has a `code` and `params`, and the
frontend builds the text in the chosen language. `message` is an English
fallback for other API clients.
"""
from __future__ import annotations

from datetime import date
from typing import Optional

from sqlmodel import Session, select

from .models import Hive, Inspection, QueenStatus, SwarmMood, VarroaMethod

OVERDUE_DAYS = 14
POOR_BROOD_MAX = 2
LOW_FOOD_MAX = 1
# The varroa threshold only makes sense for a sample of about 300 bees (sugar
# roll, alcohol wash): 3 mites is about 1%. Sticky board and drone brood
# counts use other units, so we don't check them here.
VARROA_SAMPLE_MIN = 3
VARROA_SAMPLE_METHODS = (VarroaMethod.sugar_roll, VarroaMethod.alcohol_wash)

_LEVEL_ORDER = {"danger": 0, "warning": 1, "info": 2}

# Fallback texts for the "message" field.
_ALERT_TEXT = {
    "no_inspection": lambda p: "This hive has no inspections yet.",
    "overdue": lambda p: f"Last inspection was {p['days']} days ago. In season, inspect every 7 to 14 days.",
    "queenless": lambda p: "No queen, eggs or larvae found. The colony may be queenless.",
    "swarming": lambda p: f"Swarming signs ({p['mood']}), queen cells: {p['cells']}. Consider giving more space or removing brood.",
    "poor_brood": lambda p: f"Poor brood pattern ({p['pattern']}/5). Possible queen problem or disease.",
    "low_food": lambda p: "Low food stores. Consider feeding.",
    "varroa": lambda p: f"High varroa level ({p['count']} mites in the sample). Plan treatment.",
    "disease": lambda p: f"Disease signs recorded: {p['signs']}.",
}


def _alert(hive: Hive, level: str, code: str, params: Optional[dict] = None,
           insp: Optional[Inspection] = None) -> dict:
    params = params or {}
    return {
        "hive_id": hive.id,
        "hive_name": hive.name,
        "level": level,
        "code": code,
        "params": params,
        "message": _ALERT_TEXT[code](params),
        "last_inspection": insp.date.isoformat() if insp else None,
    }


def _alerts_for_last(hive: Hive, last: Inspection, today: date) -> list[dict]:
    """Rules for the latest inspection of one hive."""
    out: list[dict] = []

    days = (today - last.date).days
    if days >= OVERDUE_DAYS:
        out.append(_alert(hive, "warning", "overdue", {"days": days}, last))

    # Same rule as in static/knowledge.js: no queen, no eggs and no larvae.
    if last.queen_status == QueenStatus.not_found and not last.eggs and not last.larvae:
        out.append(_alert(hive, "danger", "queenless", {}, last))

    if last.swarm_mood in (SwarmMood.building, SwarmMood.swarming) or last.queen_cells > 0:
        out.append(_alert(hive, "warning", "swarming",
                          {"mood": last.swarm_mood.value, "cells": last.queen_cells}, last))

    if last.brood_pattern is not None and last.brood_pattern <= POOR_BROOD_MAX:
        out.append(_alert(hive, "warning", "poor_brood", {"pattern": last.brood_pattern}, last))

    if last.stores_food is not None and last.stores_food <= LOW_FOOD_MAX:
        out.append(_alert(hive, "warning", "low_food", {}, last))

    if (
        last.varroa_method in VARROA_SAMPLE_METHODS
        and last.varroa_count is not None
        and last.varroa_count >= VARROA_SAMPLE_MIN
    ):
        out.append(_alert(hive, "danger", "varroa", {"count": last.varroa_count}, last))

    if last.disease_signs:
        out.append(_alert(hive, "danger", "disease", {"signs": last.disease_signs}, last))

    return out


def compute_alerts(session: Session) -> list[dict]:
    """Return alerts for all active hives, the most serious first."""
    out: list[dict] = []
    today = date.today()
    hives = session.exec(select(Hive).where(Hive.active == True)).all()  # noqa: E712

    for hive in hives:
        last = session.exec(
            select(Inspection)
            .where(Inspection.hive_id == hive.id)
            .order_by(Inspection.date.desc(), Inspection.id.desc())
        ).first()

        if last is None:
            out.append(_alert(hive, "info", "no_inspection"))
        else:
            out.extend(_alerts_for_last(hive, last, today))

    out.sort(key=lambda a: _LEVEL_ORDER.get(a["level"], 3))
    return out
