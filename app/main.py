from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from . import storage
from .routes import router as stories_router

app = FastAPI(title="Agiilne Tracker", version="0.1.0")

PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(stories_router)


storage.ensure_mockups_dir()
app.mount("/uploads/mockups", StaticFiles(directory=storage.MOCKUPS_DIR), name="mockups")


if PUBLIC_DIR.exists():
    app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=True), name="public")
