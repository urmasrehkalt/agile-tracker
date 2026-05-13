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

_lock = Lock()


def now_str() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def _ensure_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if DATA_FILE.exists():
        return
    if EXAMPLE_FILE.exists():
        shutil.copy(EXAMPLE_FILE, DATA_FILE)
    else:
        DATA_FILE.write_text("[]", encoding="utf-8")


def load_all() -> list[dict[str, Any]]:
    with _lock:
        _ensure_file()
        with DATA_FILE.open(encoding="utf-8") as f:
            return json.load(f)


def save_all(stories: list[dict[str, Any]]) -> None:
    with _lock:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        tmp = DATA_FILE.with_suffix(".json.tmp")
        with tmp.open("w", encoding="utf-8") as f:
            json.dump(stories, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        tmp.replace(DATA_FILE)


def next_id(items: list[dict[str, Any]], key: str = "id") -> int:
    if not items:
        return 1
    return max(int(item[key]) for item in items) + 1
