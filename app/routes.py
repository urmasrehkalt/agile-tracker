from fastapi import APIRouter, HTTPException

from . import storage
from .models import Story

router = APIRouter(prefix="/api/stories", tags=["stories"])


def _find(stories: list[dict], story_id: int) -> dict | None:
    for s in stories:
        if int(s["id"]) == story_id:
            return s
    return None


@router.get("", response_model=list[Story])
def list_stories() -> list[dict]:
    stories = storage.load_all()
    return sorted(stories, key=lambda s: (s["status"] != "todo", s.get("priority", 0), s["id"]))


@router.get("/{story_id}", response_model=Story)
def get_story(story_id: int) -> dict:
    story = _find(storage.load_all(), story_id)
    if story is None:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")
    return story
