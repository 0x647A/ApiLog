"""The tests use a separate temporary database file, never apilog.db."""
import os
import tempfile
from pathlib import Path

_TMP_DIR = tempfile.mkdtemp(prefix="apilog-tests-")
os.environ["APILOG_DB"] = str(Path(_TMP_DIR) / "test.db")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import SQLModel  # noqa: E402

from app.db import engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def client():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def hive(client):
    apiary = client.post("/api/apiaries", json={"name": "Sad"}).json()
    return client.post("/api/hives", json={"apiary_id": apiary["id"], "name": "U-01"}).json()
