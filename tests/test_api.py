import json
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import storage
from app.main import app

PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"mockup"
JPEG_BYTES = b"\xff\xd8\xff" + b"mockup"
MAX_MOCKUP_SIZE = 5 * 1024 * 1024


@pytest.fixture(autouse=True)
def isolated_data(tmp_path, monkeypatch):
    """Suuna storage iga testi puhul ajutisele andmefailile."""
    data_file = tmp_path / "stories.json"
    mockups_dir = tmp_path / "mockups"
    seed = [
        {
            "id": 1,
            "title": "Esimene story",
            "description": "Test",
            "status": "todo",
            "points": 3,
            "priority": 1,
            "acceptanceCriteria": ["Krit 1"],
            "comments": [],
            "createdAt": "2026-01-01 10:00",
            "updatedAt": "2026-01-01 10:00",
        },
        {
            "id": 2,
            "title": "Teine story",
            "description": "Test",
            "status": "doing",
            "points": 5,
            "priority": 0,
            "acceptanceCriteria": ["Krit"],
            "comments": [{"id": 1, "text": "Olemas", "createdAt": "2026-01-01 11:00"}],
            "createdAt": "2026-01-01 10:00",
            "updatedAt": "2026-01-01 11:00",
        },
    ]
    data_file.write_text(json.dumps(seed), encoding="utf-8")
    monkeypatch.setattr(storage, "DATA_FILE", data_file)
    monkeypatch.setattr(storage, "MOCKUPS_DIR", mockups_dir)
    yield data_file


@pytest.fixture
def client():
    return TestClient(app)


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_list_stories(client):
    r = client.get("/api/stories")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2


def test_get_one(client):
    r = client.get("/api/stories/1")
    assert r.status_code == 200
    assert r.json()["title"] == "Esimene story"


def test_get_missing(client):
    r = client.get("/api/stories/999")
    assert r.status_code == 404


def test_create_story(client):
    payload = {"title": "Uus", "points": 8, "acceptanceCriteria": ["K1"]}
    r = client.post("/api/stories", json=payload)
    assert r.status_code == 201
    body = r.json()
    assert body["id"] == 3
    assert body["status"] == "todo"
    assert body["points"] == 8


@pytest.mark.parametrize(
    "payload",
    [
        {"title": "X", "points": -1, "acceptanceCriteria": ["K"]},
        {"title": "X", "points": 1, "acceptanceCriteria": []},
        {"title": "", "points": 1, "acceptanceCriteria": ["K"]},
        {"title": "X", "points": "not-int", "acceptanceCriteria": ["K"]},
    ],
)
def test_create_validation(client, payload):
    r = client.post("/api/stories", json=payload)
    assert r.status_code == 422


def test_update_story(client):
    r = client.put("/api/stories/1", json={"title": "Muudetud", "points": 7})
    assert r.status_code == 200
    body = r.json()
    assert body["title"] == "Muudetud"
    assert body["points"] == 7


def test_update_missing(client):
    r = client.put("/api/stories/999", json={"title": "x"})
    assert r.status_code == 404


def test_delete_story(client):
    r = client.delete("/api/stories/2")
    assert r.status_code == 204
    r2 = client.get("/api/stories/2")
    assert r2.status_code == 404


def test_delete_missing(client):
    r = client.delete("/api/stories/999")
    assert r.status_code == 404


def test_patch_status(client):
    r = client.patch("/api/stories/1/status", json={"status": "done"})
    assert r.status_code == 200
    assert r.json()["status"] == "done"


def test_patch_status_invalid(client):
    r = client.patch("/api/stories/1/status", json={"status": "wat"})
    assert r.status_code == 422


def test_reorder(client):
    # Backlogis on ainult story 1; lisame teise todo story
    client.post(
        "/api/stories",
        json={"title": "Backlogis 2", "points": 1, "acceptanceCriteria": ["k"]},
    )
    r = client.patch("/api/stories/reorder", json={"order": [3, 1]})
    assert r.status_code == 200
    stories = {s["id"]: s for s in r.json()}
    assert stories[3]["priority"] == 0
    assert stories[1]["priority"] == 1


def test_reorder_missing_id(client):
    r = client.patch("/api/stories/reorder", json={"order": [999]})
    assert r.status_code == 404


def test_add_comment(client):
    r = client.post("/api/stories/1/comments", json={"text": "Test kommentaar"})
    assert r.status_code == 201
    assert len(r.json()["comments"]) == 1
    assert r.json()["comments"][0]["text"] == "Test kommentaar"
    assert "createdAt" in r.json()["comments"][0]


def test_add_comment_empty(client):
    r = client.post("/api/stories/1/comments", json={"text": ""})
    assert r.status_code == 422


def test_delete_comment(client):
    r = client.delete("/api/stories/2/comments/1")
    assert r.status_code == 204
    r2 = client.get("/api/stories/2")
    assert len(r2.json()["comments"]) == 0


def test_delete_comment_missing(client):
    r = client.delete("/api/stories/2/comments/999")
    assert r.status_code == 404


def test_upload_mockup(client):
    r = client.put(
        "/api/stories/1/mockup",
        files={"file": ("mockup.png", PNG_BYTES, "image/png")},
    )
    assert r.status_code == 200
    mockup = r.json()["mockup"]
    assert mockup["originalName"] == "mockup.png"
    assert mockup["contentType"] == "image/png"
    assert mockup["size"] == len(PNG_BYTES)
    assert mockup["url"].startswith("/uploads/mockups/")
    assert (storage.MOCKUPS_DIR / mockup["filename"]).exists()


def test_upload_mockup_replaces_existing_file(client):
    first = client.put(
        "/api/stories/1/mockup",
        files={"file": ("first.png", PNG_BYTES, "image/png")},
    ).json()["mockup"]
    second = client.put(
        "/api/stories/1/mockup",
        files={"file": ("second.jpg", JPEG_BYTES, "image/jpeg")},
    )
    assert second.status_code == 200
    mockup = second.json()["mockup"]
    assert mockup["originalName"] == "second.jpg"
    assert mockup["contentType"] == "image/jpeg"
    assert not (storage.MOCKUPS_DIR / first["filename"]).exists()
    assert (storage.MOCKUPS_DIR / mockup["filename"]).exists()


def test_delete_mockup(client):
    uploaded = client.put(
        "/api/stories/1/mockup",
        files={"file": ("mockup.png", PNG_BYTES, "image/png")},
    ).json()["mockup"]
    r = client.delete("/api/stories/1/mockup")
    assert r.status_code == 204
    assert not (storage.MOCKUPS_DIR / uploaded["filename"]).exists()
    assert client.get("/api/stories/1").json()["mockup"] is None


def test_delete_story_removes_mockup_file(client):
    uploaded = client.put(
        "/api/stories/1/mockup",
        files={"file": ("mockup.png", PNG_BYTES, "image/png")},
    ).json()["mockup"]
    r = client.delete("/api/stories/1")
    assert r.status_code == 204
    assert not (storage.MOCKUPS_DIR / uploaded["filename"]).exists()


def test_upload_mockup_missing_story(client):
    r = client.put(
        "/api/stories/999/mockup",
        files={"file": ("mockup.png", PNG_BYTES, "image/png")},
    )
    assert r.status_code == 404


def test_delete_mockup_missing_story(client):
    r = client.delete("/api/stories/999/mockup")
    assert r.status_code == 404


def test_delete_mockup_missing_mockup(client):
    r = client.delete("/api/stories/1/mockup")
    assert r.status_code == 404


def test_upload_mockup_invalid_type(client):
    r = client.put(
        "/api/stories/1/mockup",
        files={"file": ("mockup.txt", b"not an image", "text/plain")},
    )
    assert r.status_code == 422


def test_upload_mockup_invalid_image_content(client):
    r = client.put(
        "/api/stories/1/mockup",
        files={"file": ("mockup.png", b"not a real png", "image/png")},
    )
    assert r.status_code == 422


def test_upload_mockup_too_large(client):
    r = client.put(
        "/api/stories/1/mockup",
        files={"file": ("mockup.png", PNG_BYTES + b"x" * MAX_MOCKUP_SIZE, "image/png")},
    )
    assert r.status_code == 422
