import json
import os
import shutil
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_FILE = DATA_DIR / "stories.json"
EXAMPLE_FILE = DATA_DIR / "stories.example.json"
PROJECTS_FILE = DATA_DIR / "projects.json"
PROJECTS_EXAMPLE_FILE = DATA_DIR / "projects.example.json"
MOCKUPS_DIR = DATA_DIR / "mockups"
DEFAULT_PROJECT_ID = 1
DEFAULT_PROJECT_NAME = "Sample"

_lock = Lock()


def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def _default_project() -> dict[str, Any]:
    now = now_str()
    return {
        "id": DEFAULT_PROJECT_ID,
        "name": DEFAULT_PROJECT_NAME,
        "description": "Sample project for the existing stories.",
        "color": "#2563eb",
        "status": "active",
        "owner": "",
        "client": "",
        "deadline": "",
        "createdAt": now,
        "updatedAt": now,
    }


def _read_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(f"{path.suffix}.tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    tmp.replace(path)


def _ensure_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if DATA_FILE.exists():
        return
    if EXAMPLE_FILE.exists():
        shutil.copy(EXAMPLE_FILE, DATA_FILE)
    else:
        DATA_FILE.write_text("[]", encoding="utf-8")


def _ensure_projects_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if PROJECTS_FILE.exists():
        projects = _read_json(PROJECTS_FILE, [])
        if projects:
            return
    elif PROJECTS_EXAMPLE_FILE.exists():
        shutil.copy(PROJECTS_EXAMPLE_FILE, PROJECTS_FILE)
        projects = _read_json(PROJECTS_FILE, [])
        if projects:
            return
    _write_json(PROJECTS_FILE, [_default_project()])


def _migrate_stories_to_default_project() -> None:
    stories = _read_json(DATA_FILE, [])
    changed = False
    for story in stories:
        if "projectId" not in story or story["projectId"] is None:
            story["projectId"] = DEFAULT_PROJECT_ID
            changed = True
    if changed:
        _write_json(DATA_FILE, stories)


def ensure_mockups_dir() -> Path:
    MOCKUPS_DIR.mkdir(parents=True, exist_ok=True)
    return MOCKUPS_DIR


def delete_mockup_file(filename: str | None) -> None:
    if not filename:
        return
    path = MOCKUPS_DIR / Path(filename).name
    if path.exists() and path.is_file():
        path.unlink()


def load_all() -> list[dict[str, Any]]:
    with _lock:
        _ensure_file()
        _ensure_projects_file()
        _migrate_stories_to_default_project()
        return _read_json(DATA_FILE, [])


def save_all(stories: list[dict[str, Any]]) -> None:
    with _lock:
        _write_json(DATA_FILE, stories)


def load_projects() -> list[dict[str, Any]]:
    with _lock:
        _ensure_file()
        _ensure_projects_file()
        _migrate_stories_to_default_project()
        return _read_json(PROJECTS_FILE, [])


def save_projects(projects: list[dict[str, Any]]) -> None:
    with _lock:
        _write_json(PROJECTS_FILE, projects)


def next_id(items: list[dict[str, Any]], key: str = "id") -> int:
    if not items:
        return 1
    return max(int(item[key]) for item in items) + 1
