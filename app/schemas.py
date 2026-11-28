"""
Request body schemas.

We don't use the `table=True` models as request bodies, because SQLModel then
skips validation and type conversion (for example a date string would not
become a `date`). These separate models validate the input first, and the
routers copy the data into the database models.
"""
from datetime import date as date_
from typing import Annotated, Optional

from pydantic import StringConstraints
from sqlmodel import Field, SQLModel

from .models import QueenStatus, SwarmMood, Temperament, VarroaMethod

# Name: trimmed, not empty, max 100 characters.
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
ShortText = Annotated[str, StringConstraints(max_length=200)]
LongText = Annotated[str, StringConstraints(max_length=2000)]


class ApiaryIn(SQLModel):
    name: Name
    location: Optional[ShortText] = None
    notes: Optional[LongText] = None


class HiveIn(SQLModel):
    apiary_id: int
    name: Name
    hive_type: Optional[ShortText] = None
    bee_race: Optional[ShortText] = None
    queen_year: Optional[int] = Field(default=None, ge=1990, le=2100)
    queen_color: Optional[Annotated[str, StringConstraints(max_length=30)]] = None
    established: Optional[date_] = None
    active: bool = True
    notes: Optional[LongText] = None


class InspectionIn(SQLModel):
    hive_id: int
    date: Optional[date_] = None
    client_uuid: Optional[Annotated[str, StringConstraints(max_length=64)]] = None

    queen_status: QueenStatus = QueenStatus.seen
    eggs: bool = False
    larvae: bool = False
    capped_brood: bool = False
    brood_pattern: Optional[int] = Field(default=None, ge=1, le=5)

    swarm_mood: SwarmMood = SwarmMood.calm
    queen_cells: int = Field(default=0, ge=0, le=100)
    strength: Optional[int] = Field(default=None, ge=1, le=10)
    temperament: Temperament = Temperament.normal
    frames_bees: Optional[float] = Field(default=None, ge=0, le=100)
    frames_brood: Optional[float] = Field(default=None, ge=0, le=100)

    stores_food: Optional[int] = Field(default=None, ge=0, le=5)
    stores_pollen: Optional[int] = Field(default=None, ge=0, le=5)

    varroa_method: VarroaMethod = VarroaMethod.none
    varroa_count: Optional[int] = Field(default=None, ge=0, le=100000)
    disease_signs: Optional[ShortText] = None

    treatment: Optional[ShortText] = None
    feeding: Optional[ShortText] = None
    frames_added: Optional[int] = Field(default=None, ge=0, le=100)
    frames_removed: Optional[int] = Field(default=None, ge=0, le=100)
    supers_added: Optional[int] = Field(default=None, ge=0, le=20)
    honey_harvested_kg: Optional[float] = Field(default=None, ge=0, le=500)

    weather: Optional[ShortText] = None
    temperature_c: Optional[float] = Field(default=None, ge=-50, le=60)
    notes: Optional[LongText] = None
    todo: Optional[LongText] = None
    # Advice made in the browser (works offline), saved as a JSON string.
    advice: Optional[Annotated[str, StringConstraints(max_length=20000)]] = None
