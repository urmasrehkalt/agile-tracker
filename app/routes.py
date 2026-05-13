from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status

from . import storage
from .models import (
    CommentCreate,
    Project,
    ProjectCreate,
    ProjectUpdate,
    ReorderRequest,
    StatusUpdate,
    Story,
    StoryCreate,
    StoryUpdate,
)

router = APIRouter(prefix="/api/stories", tags=["stories"])
projects_router = APIRouter(prefix="/api/projects", tags=["projects"])

MAX_MOCKUP_SIZE = 5 * 1024 * 1024
MOCKUP_EXTENSIONS = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
}


def _find(stories: list[dict], story_id: int) -> dict | None:
    for s in stories:
        if int(s["id"]) == story_id:
            return s
    return None


def _find_project(projects: list[dict], project_id: int) -> dict | None:
    for project in projects:
        if int(project["id"]) == project_id:
            return project
    return None


def _ensure_project_exists(project_id: int) -> None:
    if _find_project(storage.load_projects(), project_id) is None:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")


def _sort_stories(stories: list[dict]) -> list[dict]:
    return sorted(stories, key=lambda s: (s["status"] != "todo", s.get("priority", 0), s["id"]))


def _validate_mockup(file: UploadFile, content: bytes) -> str:
    content_type = file.content_type or ""
    if content_type not in MOCKUP_EXTENSIONS:
        raise HTTPException(status_code=422, detail="Lubatud mockupi tüübid on PNG, JPEG ja WebP")
    if not content:
        raise HTTPException(status_code=422, detail="Mockupi fail ei tohi olla tühi")
    if len(content) > MAX_MOCKUP_SIZE:
        raise HTTPException(status_code=422, detail="Mockupi maksimaalne suurus on 5 MB")

    if content_type == "image/png" and not content.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=422, detail="Fail ei vasta PNG vormingule")
    if content_type == "image/jpeg" and not content.startswith(b"\xff\xd8\xff"):
        raise HTTPException(status_code=422, detail="Fail ei vasta JPEG vormingule")
    if content_type == "image/webp" and not (content.startswith(b"RIFF") and content[8:12] == b"WEBP"):
        raise HTTPException(status_code=422, detail="Fail ei vasta WebP vormingule")

    return MOCKUP_EXTENSIONS[content_type]


def _mockup_payload(file: UploadFile, filename: str, size: int) -> dict:
    original_name = Path(file.filename or "mockup").name or "mockup"
    return {
        "filename": filename,
        "originalName": original_name,
        "contentType": file.content_type,
        "size": size,
        "url": f"/uploads/mockups/{filename}",
        "createdAt": storage.now_str(),
    }


@projects_router.get("", response_model=list[Project])
def list_projects() -> list[dict]:
    projects = storage.load_projects()
    return sorted(projects, key=lambda p: (p.get("status") == "archived", p["name"].lower(), p["id"]))


@projects_router.get("/{project_id}", response_model=Project)
def get_project(project_id: int) -> dict:
    project = _find_project(storage.load_projects(), project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project


@projects_router.post("", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate) -> dict:
    projects = storage.load_projects()
    now = storage.now_str()
    project = {
        "id": storage.next_id(projects),
        "name": payload.name,
        "description": payload.description,
        "color": payload.color,
        "status": payload.status,
        "owner": payload.owner,
        "client": payload.client,
        "deadline": payload.deadline,
        "createdAt": now,
        "updatedAt": now,
    }
    projects.append(project)
    storage.save_projects(projects)
    return project


@projects_router.put("/{project_id}", response_model=Project)
def update_project(project_id: int, payload: ProjectUpdate) -> dict:
    projects = storage.load_projects()
    project = _find_project(projects, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    updates = payload.model_dump(exclude_unset=True)
    project.update(updates)
    project["updatedAt"] = storage.now_str()
    storage.save_projects(projects)
    return project


@projects_router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int) -> Response:
    projects = storage.load_projects()
    project = _find_project(projects, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    stories = storage.load_all()
    if any(int(story.get("projectId", storage.DEFAULT_PROJECT_ID)) == project_id for story in stories):
        raise HTTPException(status_code=409, detail="Project has stories and cannot be deleted")
    projects.remove(project)
    storage.save_projects(projects)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("", response_model=list[Story])
def list_stories(projectId: int | None = None) -> list[dict]:
    stories = storage.load_all()
    if projectId is not None:
        _ensure_project_exists(projectId)
        stories = [s for s in stories if int(s.get("projectId", storage.DEFAULT_PROJECT_ID)) == projectId]
    return _sort_stories(stories)


@router.get("/{story_id}", response_model=Story)
def get_story(story_id: int) -> dict:
    story = _find(storage.load_all(), story_id)
    if story is None:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")
    return story


@router.post("", response_model=Story, status_code=status.HTTP_201_CREATED)
def create_story(payload: StoryCreate) -> dict:
    _ensure_project_exists(payload.projectId)
    stories = storage.load_all()
    now = storage.now_str()
    todo_max_priority = max(
        (
            s.get("priority", 0)
            for s in stories
            if s["status"] == "todo" and int(s.get("projectId", storage.DEFAULT_PROJECT_ID)) == payload.projectId
        ),
        default=0,
    )
    project_max_number = max(
        (
            int(s.get("number", 0))
            for s in stories
            if int(s.get("projectId", storage.DEFAULT_PROJECT_ID)) == payload.projectId
        ),
        default=0,
    )
    new_story = {
        "id": storage.next_id(stories),
        "number": project_max_number + 1,
        "title": payload.title,
        "description": payload.description,
        "status": payload.status,
        "points": payload.points,
        "projectId": payload.projectId,
        "priority": todo_max_priority + 1 if payload.status == "todo" else 0,
        "acceptanceCriteria": payload.acceptanceCriteria,
        "comments": [],
        "mockup": None,
        "createdAt": now,
        "updatedAt": now,
    }
    stories.append(new_story)
    storage.save_all(stories)
    return new_story


@router.put("/{story_id}", response_model=Story)
def update_story(story_id: int, payload: StoryUpdate) -> dict:
    stories = storage.load_all()
    story = _find(stories, story_id)
    if story is None:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")

    updates = payload.model_dump(exclude_unset=True)
    if "projectId" in updates:
        _ensure_project_exists(int(updates["projectId"]))
    story.update(updates)
    story["updatedAt"] = storage.now_str()
    storage.save_all(stories)
    return story


@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_story(story_id: int) -> Response:
    stories = storage.load_all()
    story = _find(stories, story_id)
    if story is None:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")
    storage.delete_mockup_file((story.get("mockup") or {}).get("filename"))
    stories.remove(story)
    storage.save_all(stories)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/reorder", response_model=list[Story])
def reorder_stories(payload: ReorderRequest) -> list[dict]:
    _ensure_project_exists(payload.projectId)
    stories = storage.load_all()
    ids_in_data = {
        int(s["id"])
        for s in stories
        if int(s.get("projectId", storage.DEFAULT_PROJECT_ID)) == payload.projectId
    }
    missing = [sid for sid in payload.order if sid not in ids_in_data]
    if missing:
        raise HTTPException(status_code=404, detail=f"Stories not found: {missing}")

    priority_map = {sid: idx for idx, sid in enumerate(payload.order)}
    for s in stories:
        if int(s.get("projectId", storage.DEFAULT_PROJECT_ID)) == payload.projectId and int(s["id"]) in priority_map:
            s["priority"] = priority_map[int(s["id"])]
    storage.save_all(stories)
    return _sort_stories([s for s in stories if int(s.get("projectId", storage.DEFAULT_PROJECT_ID)) == payload.projectId])


@router.patch("/{story_id}/status", response_model=Story)
def update_status(story_id: int, payload: StatusUpdate) -> dict:
    stories = storage.load_all()
    story = _find(stories, story_id)
    if story is None:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")
    story["status"] = payload.status
    story["updatedAt"] = storage.now_str()
    storage.save_all(stories)
    return story


@router.put("/{story_id}/mockup", response_model=Story)
async def upload_mockup(story_id: int, file: UploadFile = File(...)) -> dict:
    stories = storage.load_all()
    story = _find(stories, story_id)
    if story is None:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")

    content = await file.read(MAX_MOCKUP_SIZE + 1)
    extension = _validate_mockup(file, content)
    filename = f"story-{story_id}-{uuid4().hex}{extension}"
    storage.ensure_mockups_dir()
    path = storage.MOCKUPS_DIR / filename
    with path.open("wb") as f:
        f.write(content)

    old_mockup = story.get("mockup") or {}
    storage.delete_mockup_file(old_mockup.get("filename"))
    story["mockup"] = _mockup_payload(file, filename, len(content))
    story["updatedAt"] = storage.now_str()
    storage.save_all(stories)
    return story


@router.delete("/{story_id}/mockup", status_code=status.HTTP_204_NO_CONTENT)
def delete_mockup(story_id: int) -> Response:
    stories = storage.load_all()
    story = _find(stories, story_id)
    if story is None:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")
    mockup = story.get("mockup")
    if not mockup:
        raise HTTPException(status_code=404, detail=f"Mockup not found on story {story_id}")

    storage.delete_mockup_file(mockup.get("filename"))
    story["mockup"] = None
    story["updatedAt"] = storage.now_str()
    storage.save_all(stories)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{story_id}/comments",
    response_model=Story,
    status_code=status.HTTP_201_CREATED,
)
def add_comment(story_id: int, payload: CommentCreate) -> dict:
    stories = storage.load_all()
    story = _find(stories, story_id)
    if story is None:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")
    comments = story.setdefault("comments", [])
    comment = {
        "id": storage.next_id(comments) if comments else 1,
        "text": payload.text,
        "createdAt": storage.now_str(),
    }
    comments.append(comment)
    story["updatedAt"] = comment["createdAt"]
    storage.save_all(stories)
    return story


@router.delete(
    "/{story_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_comment(story_id: int, comment_id: int) -> Response:
    stories = storage.load_all()
    story = _find(stories, story_id)
    if story is None:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")
    comments = story.get("comments", [])
    comment = next((c for c in comments if int(c["id"]) == comment_id), None)
    if comment is None:
        raise HTTPException(
            status_code=404,
            detail=f"Comment {comment_id} not found on story {story_id}",
        )
    comments.remove(comment)
    story["updatedAt"] = storage.now_str()
    storage.save_all(stories)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
