"""Project service layer for business logic."""
from app.repositories.project import ProjectRepository
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    TaskCreate,
    TaskUpdate,
    TaskStatus,
    NoteCreate,
    NoteUpdate,
    TasksByStatus,
    TaskCountsResponse
)
from app.exceptions import NotFoundError, ValidationError
from uuid import UUID
from typing import Optional


class ProjectService:
    """Service for project business logic."""

    def __init__(self, repository: ProjectRepository):
        self.repository = repository

    # Projects
    async def create_project(self, user_id: UUID, data: ProjectCreate):
        """Create a new project."""
        return await self.repository.create_project(
            user_id=user_id,
            name=data.name,
            slug=data.slug,
            objective=data.objective
        )

    async def get_project(
        self,
        project_id: UUID,
        user_id: UUID,
        load_relations: bool = False
    ):
        """Get a project by ID."""
        project = await self.repository.get_project_by_id(
            project_id,
            user_id,
            load_relations
        )
        if not project:
            raise NotFoundError("Project not found")
        return project

    async def get_project_by_slug(
        self,
        slug: str,
        user_id: UUID,
        load_relations: bool = False
    ):
        """Get a project by slug."""
        project = await self.repository.get_project_by_slug(
            slug,
            user_id,
            load_relations
        )
        if not project:
            raise NotFoundError(f"Project '{slug}' not found")
        return project

    async def list_projects(self, user_id: UUID, load_relations: bool = False):
        """List all projects for a user."""
        return await self.repository.list_projects(user_id, load_relations)

    async def update_project(
        self,
        project_id: UUID,
        user_id: UUID,
        data: ProjectUpdate
    ):
        """Update a project."""
        project = await self.get_project(project_id, user_id)

        if data.name is not None:
            project.name = data.name
        if data.objective is not None:
            project.objective = data.objective

        return await self.repository.update_project(project)

    async def delete_project(self, project_id: UUID, user_id: UUID) -> None:
        """Delete a project."""
        project = await self.get_project(project_id, user_id)
        await self.repository.delete_project(project)

    # Tasks
    async def create_task(
        self,
        project_id: UUID,
        user_id: UUID,
        data: TaskCreate
    ):
        """Create a task in a project."""
        # Verify project ownership
        await self.get_project(project_id, user_id)

        return await self.repository.create_task(
            project_id=project_id,
            title=data.title,
            description=data.description,
            status=data.status
        )

    async def get_task(self, task_id: UUID, user_id: UUID):
        """Get a task by ID."""
        task = await self.repository.get_task(task_id, user_id)
        if not task:
            raise NotFoundError("Task not found")
        return task

    async def update_task(
        self,
        task_id: UUID,
        user_id: UUID,
        data: TaskUpdate
    ):
        """Update a task."""
        task = await self.get_task(task_id, user_id)

        if data.title is not None:
            task.title = data.title
        if data.description is not None:
            task.description = data.description
        if data.status is not None:
            task.status = data.status
        if data.sort_order is not None:
            task.sort_order = data.sort_order

        return await self.repository.update_task(task)

    async def delete_task(self, task_id: UUID, user_id: UUID) -> None:
        """Delete a task."""
        task = await self.get_task(task_id, user_id)
        await self.repository.delete_task(task)

    async def reorder_tasks(
        self,
        project_id: UUID,
        user_id: UUID,
        task_updates: list[dict]
    ) -> None:
        """Reorder tasks within their status column."""
        # Verify project ownership
        await self.get_project(project_id, user_id)

        # Convert to tuples for repository
        updates = [(UUID(t['id']), t['sort_order']) for t in task_updates]
        await self.repository.reorder_tasks(project_id, updates)

    async def move_task(
        self,
        task_id: UUID,
        user_id: UUID,
        new_status: TaskStatus,
        new_order: int
    ):
        """Move task to different status column."""
        task = await self.get_task(task_id, user_id)

        task.status = new_status
        task.sort_order = new_order

        return await self.repository.update_task(task)

    async def clear_completed_tasks(self, project_id: UUID, user_id: UUID):
        """Clear all completed tasks for a project."""
        # Verify project ownership
        await self.get_project(project_id, user_id)

        count = await self.repository.delete_completed_tasks(project_id)
        return {"deleted_count": count}

    async def get_task_counts(
        self,
        project_id: UUID
    ) -> TaskCountsResponse:
        """Get task counts by status for a project."""
        counts = await self.repository.get_task_counts_by_project(project_id)
        return TaskCountsResponse(**counts)

    # Notes
    async def create_note(
        self,
        project_id: UUID,
        user_id: UUID,
        data: NoteCreate
    ):
        """Create a note on a project."""
        # Verify project ownership
        await self.get_project(project_id, user_id)

        return await self.repository.create_note(
            project_id=project_id,
            content=data.content
        )

    async def get_note(self, note_id: UUID, user_id: UUID):
        """Get a note by ID."""
        note = await self.repository.get_note(note_id, user_id)
        if not note:
            raise NotFoundError("Note not found")
        return note

    async def update_note(
        self,
        note_id: UUID,
        user_id: UUID,
        data: NoteUpdate
    ):
        """Update a note."""
        note = await self.get_note(note_id, user_id)
        note.content = data.content
        return await self.repository.update_note(note)

    async def delete_note(self, note_id: UUID, user_id: UUID) -> None:
        """Delete a note."""
        note = await self.get_note(note_id, user_id)
        await self.repository.delete_note(note)

    # Helper methods for response formatting
    def group_tasks_by_status(self, tasks: list) -> TasksByStatus:
        """Group tasks by their status."""
        grouped = {
            "in_progress": [],
            "backlog": [],
            "completed": []
        }

        for task in tasks:
            grouped[task.status.value].append(task)

        return TasksByStatus(**grouped)
