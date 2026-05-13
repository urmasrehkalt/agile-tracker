from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["todo", "doing", "done"]


class Comment(BaseModel):
    id: int
    text: str = Field(min_length=1)
    createdAt: str


class Story(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    title: str = Field(min_length=1)
    description: str = ""
    status: Status = "todo"
    points: int = Field(ge=0)
    priority: int = 0
    acceptanceCriteria: list[str] = Field(min_length=1)
    comments: list[Comment] = []
    createdAt: str
    updatedAt: str


class StoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1)
    description: str = ""
    status: Status = "todo"
    points: int = Field(ge=0)
    acceptanceCriteria: list[str] = Field(min_length=1)


class StoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    status: Status | None = None
    points: int | None = Field(default=None, ge=0)
    acceptanceCriteria: list[str] | None = Field(default=None, min_length=1)


class StatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Status


class ReorderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    order: list[int] = Field(min_length=1)


class CommentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1)
