"""Tests for the English-primary UI with an EN/ET language toggle (issue #56).

No JS runtime is available, so the front-end i18n contract is verified at the
serving layer (the i18n.js asset and the rendered index.html). The backend
canonical-English strings are verified through the API.
"""
import json

import pytest
from fastapi.testclient import TestClient

from app import storage
from app.main import app


@pytest.fixture(autouse=True)
def isolated_data(tmp_path, monkeypatch):
    """Isolate storage on temp files and force the English default project.

    PROJECTS_FILE / PROJECTS_EXAMPLE_FILE point at non-existent temp paths so
    that load_projects() falls back to storage._default_project() instead of the
    Estonian seed in data/projects.example.json.
    """
    data_file = tmp_path / "stories.json"
    seed = [
        {
            "id": 1,
            "number": 1,
            "title": "First story",
            "description": "Test",
            "status": "todo",
            "points": 3,
            "priority": 1,
            "projectId": 1,
            "acceptanceCriteria": ["AC 1"],
            "comments": [],
            "createdAt": "2026-01-01 10:00",
            "updatedAt": "2026-01-01 10:00",
        }
    ]
    data_file.write_text(json.dumps(seed), encoding="utf-8")
    monkeypatch.setattr(storage, "DATA_FILE", data_file)
    monkeypatch.setattr(storage, "EXAMPLE_FILE", tmp_path / "stories.example.json")
    monkeypatch.setattr(storage, "PROJECTS_FILE", tmp_path / "projects.json")
    monkeypatch.setattr(storage, "PROJECTS_EXAMPLE_FILE", tmp_path / "projects.example.json")
    monkeypatch.setattr(storage, "MOCKUPS_DIR", tmp_path / "mockups")
    yield


@pytest.fixture
def client():
    return TestClient(app)


def test_i18n_js_is_served_with_both_locales(client):
    r = client.get("/i18n.js")
    assert r.status_code == 200
    body = r.text
    # Both locale maps are present.
    assert "en: {" in body
    assert "et: {" in body
    # A few representative keys exist.
    for key in ['"story.addButton"', '"column.todoSubtitle"', '"dialog.deleteStory"']:
        assert key in body
    # English (primary) and Estonian (secondary) values both ship.
    assert "New story" in body
    assert "Uus story" in body


def test_index_html_is_served_in_english(client):
    r = client.get("/")
    assert r.status_code == 200
    html = r.text
    assert '<html lang="en">' in html
    assert "/i18n.js" in html
    assert "data-i18n=" in html
    # English defaults are rendered.
    assert "+ New story" in html
    assert "Todo / Backlog" in html
    # No Estonian UI strings remain hardcoded in the static markup.
    for estonian in ("Uus story", "Halda projekte", "Tühista", "Vastuvõtutingimused", "Salvesta"):
        assert estonian not in html


def test_default_project_name_is_english(client):
    r = client.get("/api/projects")
    assert r.status_code == 200
    projects = r.json()
    assert len(projects) == 1
    assert projects[0]["name"] == "Sample"
    assert "Sample project" in projects[0]["description"]


def test_mockup_validation_message_is_english(client):
    r = client.put(
        "/api/stories/1/mockup",
        files={"file": ("note.txt", b"hello", "text/plain")},
    )
    assert r.status_code == 422
    assert r.json()["detail"] == "Allowed mockup types are PNG, JPEG and WebP"
