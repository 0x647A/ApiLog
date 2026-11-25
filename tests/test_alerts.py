from datetime import date, timedelta


def _codes(client):
    return {a["code"] for a in client.get("/api/alerts").json()}


def _inspect(client, hive, **fields):
    body = {"hive_id": hive["id"], "date": date.today().isoformat(), **fields}
    assert client.post("/api/inspections", json=body).status_code == 201


def test_hive_without_inspection_gets_info_alert(client, hive):
    assert _codes(client) == {"no_inspection"}


def test_queenless_alert_needs_no_eggs_and_no_larvae(client, hive):
    _inspect(client, hive, queen_status="nie_znaleziono", larvae=True)
    assert "queenless" not in _codes(client)

    _inspect(client, hive, queen_status="nie_znaleziono")
    assert "queenless" in _codes(client)


def test_varroa_alert_only_for_sample_methods(client, hive):
    _inspect(client, hive, varroa_method="wklad_dennicowy", varroa_count=5)
    assert "varroa" not in _codes(client)

    _inspect(client, hive, varroa_method="smyw_alkoholowy", varroa_count=3)
    assert "varroa" in _codes(client)


def test_overdue_alert_after_14_days(client, hive):
    _inspect(client, hive, date=(date.today() - timedelta(days=14)).isoformat())
    assert "overdue" in _codes(client)


def test_swarming_and_disease_alerts(client, hive):
    _inspect(client, hive, swarm_mood="rojowy", queen_cells=4, disease_signs="nosema")
    codes = _codes(client)
    assert {"swarming", "disease"} <= codes


def test_alerts_are_sorted_by_level(client, hive):
    _inspect(client, hive, disease_signs="zgnilec", stores_food=0)
    levels = [a["level"] for a in client.get("/api/alerts").json()]
    assert levels == sorted(levels, key=["danger", "warning", "info"].index)
