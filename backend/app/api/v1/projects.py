"""Projects API endpoints."""
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectDetailResponse,
    ProjectSummaryResponse,
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskMoveRequest,
    TaskReorderRequest,
    TaskStatus,
    NoteCreate,
    NoteUpdate,
    NoteResponse,
    ClearCompletedResponse,
    TasksByStatus
)
from app.repositories.project import ProjectRepository
from app.services.project import ProjectService

router = APIRouter(prefix="/v1/projects", tags=["Projects"])


def get_project_service(db: AsyncSession = Depends(get_db)) -> ProjectService:
    """Dependency to get project service."""
    repository = ProjectRepository(db)
    return ProjectService(repository)


# Projects
@router.get("", response_model=List[ProjectDetailResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """List all projects with tasks and notes."""
    projects = await service.list_projects(current_user.id, load_relations=True)

    # Convert to detailed responses with grouped tasks
    result = []
    for project in projects:
        grouped_tasks = service.group_tasks_by_status(project.tasks)
        result.append(ProjectDetailResponse(
            id=project.id,
            name=project.name,
            slug=project.slug,
            objective=project.objective,
            created_at=project.created_at,
            updated_at=project.updated_at,
            tasks=grouped_tasks,
            notes=project.notes
        ))

    return result


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Create a new project."""
    return await service.create_project(current_user.id, data)


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Get project by ID with tasks and notes."""
    project = await service.get_project(project_id, current_user.id, load_relations=True)

    grouped_tasks = service.group_tasks_by_status(project.tasks)
    return ProjectDetailResponse(
        id=project.id,
        name=project.name,
        slug=project.slug,
        objective=project.objective,
        created_at=project.created_at,
        updated_at=project.updated_at,
        tasks=grouped_tasks,
        notes=project.notes
    )


@router.get("/slug/{slug}", response_model=ProjectDetailResponse)
async def get_project_by_slug(
    slug: str,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Get project by slug with tasks and notes."""
    project = await service.get_project_by_slug(slug, current_user.id, load_relations=True)

    grouped_tasks = service.group_tasks_by_status(project.tasks)
    return ProjectDetailResponse(
        id=project.id,
        name=project.name,
        slug=project.slug,
        objective=project.objective,
        created_at=project.created_at,
        updated_at=project.updated_at,
        tasks=grouped_tasks,
        notes=project.notes
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Update a project."""
    return await service.update_project(project_id, current_user.id, data)


# Tasks
@router.post("/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: UUID,
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Create a task in a project."""
    return await service.create_task(project_id, current_user.id, data)


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Get a specific task."""
    return await service.get_task(task_id, current_user.id)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Update a task."""
    return await service.update_task(task_id, current_user.id, data)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Delete a task."""
    await service.delete_task(task_id, current_user.id)


@router.post("/{project_id}/tasks/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_tasks(
    project_id: UUID,
    data: TaskReorderRequest,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Reorder tasks within a status column."""
    task_updates = [
        {"id": str(task_id), "sort_order": idx}
        for idx, task_id in enumerate(data.task_order)
    ]
    await service.reorder_tasks(project_id, current_user.id, task_updates)


@router.patch("/tasks/{task_id}/move", response_model=TaskResponse)
async def move_task(
    task_id: UUID,
    data: TaskMoveRequest,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Move task to different status column."""
    return await service.move_task(
        task_id,
        current_user.id,
        data.new_status,
        data.sort_order
    )


@router.delete("/{project_id}/tasks/completed", response_model=ClearCompletedResponse)
async def clear_completed_tasks(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Clear all completed tasks for a project."""
    return await service.clear_completed_tasks(project_id, current_user.id)


# Notes
@router.post("/{project_id}/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    project_id: UUID,
    data: NoteCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Create a note on a project."""
    return await service.create_note(project_id, current_user.id, data)


@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Get a specific note."""
    return await service.get_note(note_id, current_user.id)


@router.patch("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: UUID,
    data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Update a note."""
    return await service.update_note(note_id, current_user.id, data)


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service)
):
    """Delete a note."""
    await service.delete_note(note_id, current_user.id)
