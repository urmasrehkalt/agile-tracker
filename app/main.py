from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Agiilne Tracker", version="0.1.0")

PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


if PUBLIC_DIR.exists():
    app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=True), name="public")
