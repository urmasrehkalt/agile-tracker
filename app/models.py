from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["todo", "doing", "done"]
ProjectStatus = Literal["active", "archived"]


class Project(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    color: str = "#2563eb"
    status: ProjectStatus = "active"
    owner: str = ""
    client: str = ""
    deadline: str = ""
    createdAt: str
    updatedAt: str


class ProjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    color: str = "#2563eb"
    status: ProjectStatus = "active"
    owner: str = ""
    client: str = ""
    deadline: str = ""


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    color: str | None = None
    status: ProjectStatus | None = None
    owner: str | None = None
    client: str | None = None
    deadline: str | None = None


class Comment(BaseModel):
    id: int
    text: str = Field(min_length=1)
    createdAt: str


class Mockup(BaseModel):
    filename: str = Field(min_length=1)
    originalName: str = Field(min_length=1)
    contentType: str = Field(min_length=1)
    size: int = Field(ge=1)
    url: str = Field(min_length=1)
    createdAt: str


class Story(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    number: int = Field(ge=1)
    title: str = Field(min_length=1)
    description: str = ""
    status: Status = "todo"
    points: int = Field(ge=0)
    projectId: int = 1
    priority: int = 0
    acceptanceCriteria: list[str] = Field(min_length=1)
    comments: list[Comment] = []
    mockup: Mockup | None = None
    createdAt: str
    updatedAt: str


class StoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1)
    description: str = ""
    status: Status = "todo"
    points: int = Field(ge=0)
    projectId: int = 1
    acceptanceCriteria: list[str] = Field(min_length=1)


class StoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    status: Status | None = None
    points: int | None = Field(default=None, ge=0)
    projectId: int | None = None
    acceptanceCriteria: list[str] | None = Field(default=None, min_length=1)


class StatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Status


class ReorderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order: list[int] = Field(min_length=1)
    projectId: int = 1


class CommentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1)
