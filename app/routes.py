from fastapi import APIRouter, HTTPException, status

from . import storage
from .models import Story, StoryCreate

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


@router.post("", response_model=Story, status_code=status.HTTP_201_CREATED)
def create_story(payload: StoryCreate) -> dict:
    stories = storage.load_all()
    now = storage.now_str()
    todo_max_priority = max(
        (s.get("priority", 0) for s in stories if s["status"] == "todo"),
        default=0,
    )
    new_story = {
        "id": storage.next_id(stories),
        "title": payload.title,
        "description": payload.description,
        "status": payload.status,
        "points": payload.points,
        "priority": todo_max_priority + 1 if payload.status == "todo" else 0,
        "acceptanceCriteria": payload.acceptanceCriteria,
        "comments": [],
        "createdAt": now,
        "updatedAt": now,
    }
    stories.append(new_story)
    storage.save_all(stories)
    return new_story
