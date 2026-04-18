"""
project_models.py
Pydantic v2 models for project request/response shapes.
"""

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=100)]
    description: Annotated[str, Field(max_length=500)] = ""


class ProjectMeta(BaseModel):
    name: str
    slug: str
    description: str
    created_at: datetime
    meeting_count: int


class ProjectListResponse(BaseModel):
    projects: list[ProjectMeta]


class ProjectRename(BaseModel):
    new_name: Annotated[str, Field(min_length=1, max_length=100)]


class StorageInfo(BaseModel):
    projects_size_mb: float
    total_projects: int
    total_meetings: int
    free_disk_gb: float
