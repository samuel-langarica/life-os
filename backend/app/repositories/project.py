"""Project repository for database operations."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from sqlalchemy.orm import selectinload
from app.models.project import Project, ProjectTask, ProjectNote, TaskStatus
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional


class ProjectRepository:
    """Repository for project database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # Projects
    async def create_project(
        self,
        user_id: UUID,
        name: str,
        slug: str,
        objective: Optional[str] = None
    ) -> Project:
        """Create a new project."""
        project = Project(
            user_id=user_id,
            name=name,
            slug=slug,
            objective=objective
        )
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def get_project_by_id(
        self,
        project_id: UUID,
        user_id: UUID,
        load_relations: bool = False
    ) -> Optional[Project]:
        """Get a project by ID."""
        query = select(Project).where(
            and_(
                Project.id == project_id,
                Project.user_id == user_id
            )
        )

        if load_relations:
            query = query.options(
                selectinload(Project.tasks),
                selectinload(Project.notes)
            )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_project_by_slug(
        self,
        slug: str,
        user_id: UUID,
        load_relations: bool = False
    ) -> Optional[Project]:
        """Get a project by slug."""
        query = select(Project).where(
            and_(
                Project.slug == slug,
                Project.user_id == user_id
            )
        )

        if load_relations:
            query = query.options(
                selectinload(Project.tasks),
                selectinload(Project.notes)
            )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def list_projects(
        self,
        user_id: UUID,
        load_relations: bool = False
    ) -> list[Project]:
        """List all projects for a user."""
        query = select(Project).where(
            Project.user_id == user_id
        ).order_by(Project.created_at)

        if load_relations:
            query = query.options(
                selectinload(Project.tasks),
                selectinload(Project.notes)
            )

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_project(self, project: Project) -> Project:
        """Update a project."""
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete_project(self, project: Project) -> None:
        """Delete a project."""
        await self.db.delete(project)
        await self.db.commit()

    # Tasks
    async def create_task(
        self,
        project_id: UUID,
        title: str,
        description: Optional[str],
        status: TaskStatus
    ) -> ProjectTask:
        """Create a new task."""
        # Get max sort_order for this status
        result = await self.db.execute(
            select(func.max(ProjectTask.sort_order)).where(
                and_(
                    ProjectTask.project_id == project_id,
                    ProjectTask.status == status
                )
            )
        )
        max_order = result.scalar() or -1

        task = ProjectTask(
            project_id=project_id,
            title=title,
            description=description,
            status=status,
            sort_order=max_order + 1
        )
        self.db.add(task)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def get_task(self, task_id: UUID, user_id: UUID) -> Optional[ProjectTask]:
        """Get a task by ID (with user ownership verification via project)."""
        result = await self.db.execute(
            select(ProjectTask)
            .join(Project)
            .where(
                and_(
                    ProjectTask.id == task_id,
                    Project.user_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def update_task(self, task: ProjectTask) -> ProjectTask:
        """Update a task."""
        # Auto-set completed_at when status changes to completed
        if task.status == TaskStatus.COMPLETED and not task.completed_at:
            task.completed_at = datetime.now(timezone.utc)
        elif task.status != TaskStatus.COMPLETED and task.completed_at:
            task.completed_at = None

        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def delete_task(self, task: ProjectTask) -> None:
        """Delete a task."""
        await self.db.delete(task)
        await self.db.commit()

    async def reorder_tasks(
        self,
        project_id: UUID,
        task_updates: list[tuple[UUID, int]]
    ) -> None:
        """Update sort_order for multiple tasks."""
        for task_id, new_order in task_updates:
            await self.db.execute(
                select(ProjectTask)
                .where(ProjectTask.id == task_id)
                .with_for_update()
            )

            result = await self.db.execute(
                select(ProjectTask).where(ProjectTask.id == task_id)
            )
            task = result.scalar_one_or_none()
            if task:
                task.sort_order = new_order

        await self.db.commit()

    async def delete_completed_tasks(self, project_id: UUID) -> int:
        """Delete all completed tasks for a project."""
        result = await self.db.execute(
            select(ProjectTask).where(
                and_(
                    ProjectTask.project_id == project_id,
                    ProjectTask.status == TaskStatus.COMPLETED
                )
            )
        )
        tasks = list(result.scalars().all())

        for task in tasks:
            await self.db.delete(task)

        await self.db.commit()
        return len(tasks)

    async def get_task_counts_by_project(
        self,
        project_id: UUID
    ) -> dict[str, int]:
        """Get task counts grouped by status for a project."""
        result = await self.db.execute(
            select(
                ProjectTask.status,
                func.count(ProjectTask.id)
            )
            .where(ProjectTask.project_id == project_id)
            .group_by(ProjectTask.status)
        )

        counts = {
            "in_progress": 0,
            "backlog": 0,
            "completed": 0
        }

        for status, count in result.all():
            counts[status.value] = count

        return counts

    # Notes
    async def create_note(self, project_id: UUID, content: str) -> ProjectNote:
        """Create a new note."""
        note = ProjectNote(
            project_id=project_id,
            content=content
        )
        self.db.add(note)
        await self.db.commit()
        await self.db.refresh(note)
        return note

    async def get_note(self, note_id: UUID, user_id: UUID) -> Optional[ProjectNote]:
        """Get a note by ID (with user ownership verification via project)."""
        result = await self.db.execute(
            select(ProjectNote)
            .join(Project)
            .where(
                and_(
                    ProjectNote.id == note_id,
                    Project.user_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def update_note(self, note: ProjectNote) -> ProjectNote:
        """Update a note."""
        await self.db.commit()
        await self.db.refresh(note)
        return note

    async def delete_note(self, note: ProjectNote) -> None:
        """Delete a note."""
        await self.db.delete(note)
        await self.db.commit()
