"""SQLite connection. By default the database is `apilog.db` in the project folder."""
from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine

_DEFAULT_DB = Path(__file__).resolve().parent.parent / "apilog.db"
# APILOG_DB lets you use another file (the tests use a temporary one).
DB_PATH = Path(os.environ.get("APILOG_DB", _DEFAULT_DB))

# check_same_thread=False: FastAPI can handle requests in different threads.
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _enable_foreign_keys(dbapi_connection, _record) -> None:
    # SQLite does not check foreign keys by default, so turn it on for every connection.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def init_db() -> None:
    # Import the models so SQLModel knows the tables before create_all.
    from . import models  # noqa: F401
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
