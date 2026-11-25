from app.db import DB_PATH


def test_tests_use_a_temporary_database():
    assert DB_PATH.name == "test.db"


def test_create_and_list_apiaries(client):
    response = client.post("/api/apiaries", json={"name": "  Sad  ", "location": "Wieś"})
    assert response.status_code == 201
    assert response.json()["name"] == "Sad"
    assert [a["name"] for a in client.get("/api/apiaries").json()] == ["Sad"]


def test_apiary_name_cannot_be_empty_or_too_long(client):
    assert client.post("/api/apiaries", json={"name": "   "}).status_code == 422
    assert client.post("/api/apiaries", json={"name": "x" * 101}).status_code == 422


def test_hive_requires_existing_apiary(client):
    response = client.post("/api/hives", json={"apiary_id": 999, "name": "U-01"})
    assert response.status_code == 400


def test_hive_cannot_be_moved_to_missing_apiary(client, hive):
    response = client.put(f"/api/hives/{hive['id']}", json={"apiary_id": 999, "name": "U-01"})
    assert response.status_code == 400
    assert client.get(f"/api/hives/{hive['id']}").json()["apiary_id"] == hive["apiary_id"]


def test_inspection_post_is_idempotent(client, hive):
    body = {"hive_id": hive["id"], "client_uuid": "abc-123", "notes": "pierwszy"}
    first = client.post("/api/inspections", json=body)
    second = client.post("/api/inspections", json={**body, "notes": "drugi"})
    assert first.status_code == 201
    assert second.json()["id"] == first.json()["id"]
    assert len(client.get("/api/inspections").json()) == 1


def test_inspection_rejects_too_long_notes(client, hive):
    response = client.post("/api/inspections", json={"hive_id": hive["id"], "notes": "x" * 2001})
    assert response.status_code == 422


def test_inspection_rejects_negative_varroa_count(client, hive):
    response = client.post("/api/inspections", json={"hive_id": hive["id"], "varroa_count": -1})
    assert response.status_code == 422


def test_deleting_apiary_deletes_its_hives_and_inspections(client, hive):
    client.post("/api/inspections", json={"hive_id": hive["id"]})
    assert client.delete(f"/api/apiaries/{hive['apiary_id']}").status_code == 204
    assert client.get("/api/hives").json() == []
    assert client.get("/api/inspections").json() == []


def test_swagger_ui_is_disabled_and_headers_are_set(client):
    assert client.get("/docs").status_code == 404
    response = client.get("/")
    assert response.status_code == 200
    assert "script-src 'self'" in response.headers["content-security-policy"]
