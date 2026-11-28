"""
Database models for the apiary logbook.

The inspection fields follow what a beekeeper actually checks when opening a
hive (see the table in README.md): queen and brood, swarming signs, colony
strength and temperament, food and pollen stores, varroa and other disease
signs, actions taken, weather and notes for the next visit.

Everything is stored in one SQLite file (apilog.db), so a backup is just a copy
of that file.
"""
from datetime import date as date_, datetime, timezone
from enum import Enum
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# Enum values are stored in the database and sent to the frontend, so they
# stay in Polish. Changing them would break existing data.

class QueenStatus(str, Enum):
    """What the beekeeper found about the queen."""
    seen = "widziana"                 # queen seen on a comb
    eggs_only = "jaja"                # queen not seen, but fresh eggs
    not_found = "nie_znaleziono"      # no queen found
    unmarked = "nieoznakowana"        # queen present but not marked


class SwarmMood(str, Enum):
    """Swarming signs. Important when deciding to give more space or take brood."""
    calm = "spokojny"
    building = "budujacy"             # queen cells starting
    swarming = "rojowy"               # mature swarm cells


class Temperament(str, Enum):
    gentle = "lagodny"
    normal = "normalny"
    aggressive = "agresywny"


class VarroaMethod(str, Enum):
    none = "brak"
    sugar_roll = "cukier_puder"
    alcohol_wash = "smyw_alkoholowy"
    sticky_board = "wklad_dennicowy"
    drone_brood = "czerw_trutowy"


class Apiary(SQLModel, table=True):
    """An apiary: usually one place with several hives."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    location: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=_utcnow)

    hives: List["Hive"] = Relationship(back_populates="apiary")


class Hive(SQLModel, table=True):
    """A single hive."""
    id: Optional[int] = Field(default=None, primary_key=True)
    apiary_id: int = Field(foreign_key="apiary.id", index=True)

    name: str                                  # hive name or number, e.g. "U-01"
    hive_type: Optional[str] = None            # e.g. Langstroth, Dadant
    bee_race: Optional[str] = None             # bee breed or line
    queen_year: Optional[int] = None           # year the queen was born
    queen_color: Optional[str] = None          # queen marking colour
    established: Optional[date_] = None        # date the colony was started
    active: bool = True                        # False = colony is gone
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=_utcnow)

    apiary: Optional[Apiary] = Relationship(back_populates="hives")
    inspections: List["Inspection"] = Relationship(back_populates="hive")


class Inspection(SQLModel, table=True):
    """One hive inspection."""
    id: Optional[int] = Field(default=None, primary_key=True)
    hive_id: int = Field(foreign_key="hive.id", index=True)
    date: date_ = Field(default_factory=date_.today, index=True)

    # Unique id from the browser, so a repeated offline sync makes no duplicate.
    client_uuid: Optional[str] = Field(default=None, index=True, unique=True)

    # Queen and brood
    queen_status: QueenStatus = QueenStatus.seen
    eggs: bool = False                         # fresh eggs (queen laid in the last ~3 days)
    larvae: bool = False
    capped_brood: bool = False
    brood_pattern: Optional[int] = Field(default=None, ge=1, le=5)

    # Swarming, strength, temperament
    swarm_mood: SwarmMood = SwarmMood.calm
    queen_cells: int = 0
    strength: Optional[int] = Field(default=None, ge=1, le=10)
    temperament: Temperament = Temperament.normal
    frames_bees: Optional[float] = None        # frames covered with bees
    frames_brood: Optional[float] = None       # frames with brood

    # Stores (0 = none, 5 = plenty)
    stores_food: Optional[int] = Field(default=None, ge=0, le=5)
    stores_pollen: Optional[int] = Field(default=None, ge=0, le=5)

    # Health
    varroa_method: VarroaMethod = VarroaMethod.none
    varroa_count: Optional[int] = None         # number of mites (unit depends on the method)
    disease_signs: Optional[str] = None        # e.g. foulbrood, nosema

    # Actions taken
    treatment: Optional[str] = None
    feeding: Optional[str] = None              # type and amount
    frames_added: Optional[int] = None
    frames_removed: Optional[int] = None
    supers_added: Optional[int] = None
    honey_harvested_kg: Optional[float] = None

    # Context and notes
    weather: Optional[str] = None
    temperature_c: Optional[float] = None
    notes: Optional[str] = None
    todo: Optional[str] = None                 # what to do at the next inspection
    advice: Optional[str] = None               # JSON with the advice made in the browser
    created_at: datetime = Field(default_factory=_utcnow)

    hive: Optional[Hive] = Relationship(back_populates="inspections")
