'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  projectsApi,
  TaskStatus,
  Task,
  ProjectDetail,
  TaskCreateRequest,
  TaskUpdateRequest,
} from '@/lib/api/projects';
import { KanbanColumn } from '@/components/projects/KanbanColumn';
import { TaskModal } from '@/components/projects/TaskModal';
import { ObjectiveModal } from '@/components/projects/ObjectiveModal';
import { NotesModal } from '@/components/projects/NotesModal';

type ProjectSlug = 'barbania' | 'chaliao' | 'work';

const PROJECT_TABS: { slug: ProjectSlug; name: string }[] = [
  { slug: 'barbania', name: 'Barbania' },
  { slug: 'chaliao', name: 'Chaliao' },
  { slug: 'work', name: 'Work' },
];

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<ProjectSlug>('barbania');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [objectiveModalOpen, setObjectiveModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>(TaskStatus.BACKLOG);

  // Fetch current project
  const { data: project, isLoading, error } = useSWR(
    `/projects/slug/${activeTab}`,
    () => projectsApi.getBySlug(activeTab)
  );

  // Initialize default projects on first load
  useEffect(() => {
    const initializeProjects = async () => {
      try {
        const projects = await projectsApi.list();
        const slugs = projects.map((p) => p.slug);

        // Create default projects if they don't exist
        for (const { slug, name } of PROJECT_TABS) {
          if (!slugs.includes(slug)) {
            await projectsApi.create({ name, slug });
          }
        }

        // Refresh data
        mutate('/projects/slug/barbania');
        mutate('/projects/slug/chaliao');
        mutate('/projects/slug/work');
      } catch (error) {
        console.error('Failed to initialize projects:', error);
      }
    };

    initializeProjects();
  }, []);

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Add visual feedback during drag
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over || !project) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Find the task
    const allTasks = [
      ...project.tasks.backlog,
      ...project.tasks.in_progress,
      ...project.tasks.completed,
    ];
    const task = allTasks.find((t) => t.id === taskId);

    if (!task) return;

    // If status changed, move the task
    if (task.status !== newStatus) {
      try {
        // Optimistic update
        const newTasks = { ...project.tasks };
        const oldStatusKey = task.status;
        const newStatusKey = newStatus;

        // Remove from old status
        newTasks[oldStatusKey] = newTasks[oldStatusKey].filter((t) => t.id !== taskId);

        // Add to new status
        newTasks[newStatusKey] = [
          ...newTasks[newStatusKey],
          { ...task, status: newStatus },
        ];

        mutate(
          `/projects/slug/${activeTab}`,
          { ...project, tasks: newTasks },
          false
        );

        // Make API call
        await projectsApi.moveTask(taskId, {
          new_status: newStatus,
          sort_order: newTasks[newStatusKey].length - 1,
        });

        // Revalidate
        mutate(`/projects/slug/${activeTab}`);
      } catch (error) {
        console.error('Failed to move task:', error);
        // Revert on error
        mutate(`/projects/slug/${activeTab}`);
      }
    } else {
      // Reorder within same column
      const tasksInColumn = project.tasks[task.status];
      const oldIndex = tasksInColumn.findIndex((t) => t.id === taskId);
      const newIndex = tasksInColumn.findIndex((t) => t.id === over.id);

      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
        try {
          const reordered = [...tasksInColumn];
          const [removed] = reordered.splice(oldIndex, 1);
          reordered.splice(newIndex, 0, removed);

          // Optimistic update
          mutate(
            `/projects/slug/${activeTab}`,
            {
              ...project,
              tasks: {
                ...project.tasks,
                [task.status]: reordered,
              },
            },
            false
          );

          // Make API call
          await projectsApi.reorderTasks(project.id, {
            status: task.status,
            task_order: reordered.map((t) => t.id),
          });

          // Revalidate
          mutate(`/projects/slug/${activeTab}`);
        } catch (error) {
          console.error('Failed to reorder tasks:', error);
          mutate(`/projects/slug/${activeTab}`);
        }
      }
    }
  };

  // Task handlers
  const handleAddTask = (status: TaskStatus) => {
    setEditingTask(undefined);
    setDefaultTaskStatus(status);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (
    data: TaskCreateRequest | TaskUpdateRequest,
    taskId?: string
  ) => {
    if (!project) return;

    if (taskId) {
      // Update existing task
      await projectsApi.updateTask(taskId, data);
    } else {
      // Create new task
      await projectsApi.createTask(project.id, data as TaskCreateRequest);
    }

    mutate(`/projects/slug/${activeTab}`);
  };

  const handleDeleteTask = async (taskId: string) => {
    await projectsApi.deleteTask(taskId);
    mutate(`/projects/slug/${activeTab}`);
  };

  // Objective handlers
  const handleSaveObjective = async (objective: string) => {
    if (!project) return;
    await projectsApi.update(project.id, { objective });
    mutate(`/projects/slug/${activeTab}`);
  };

  // Notes handlers
  const handleSaveNotes = async (content: string, noteId?: string) => {
    if (!project) return;

    if (noteId) {
      await projectsApi.updateNote(noteId, { content });
    } else {
      await projectsApi.createNote(project.id, { content });
    }

    mutate(`/projects/slug/${activeTab}`);
  };

  // Clear completed tasks
  const handleClearCompleted = async () => {
    if (!project || project.tasks.completed.length === 0) return;

    const count = project.tasks.completed.length;
    if (!confirm(`Clear ${count} completed task${count > 1 ? 's' : ''}?`)) return;

    try {
      await projectsApi.clearCompletedTasks(project.id);
      mutate(`/projects/slug/${activeTab}`);
    } catch (error) {
      console.error('Failed to clear completed tasks:', error);
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 dark:text-red-400">Failed to load project</p>
        <button
          onClick={() => mutate(`/projects/slug/${activeTab}`)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Projects</h1>
        <p className="text-muted-foreground mt-1">Manage your active projects</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          {PROJECT_TABS.map((tab) => (
            <button
              key={tab.slug}
              onClick={() => setActiveTab(tab.slug)}
              className={`pb-3 px-2 font-medium text-sm transition-colors relative ${
                activeTab === tab.slug
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.name}
              {activeTab === tab.slug && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Project Content */}
      {project && (
        <div className="space-y-8">
          {/* Current Objective */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Current Objective
            </h2>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-gray-900 dark:text-gray-100 min-h-[2rem]">
                {project.objective || (
                  <span className="text-gray-400 dark:text-gray-500 italic">
                    No objective set
                  </span>
                )}
              </p>
              <button
                onClick={() => setObjectiveModalOpen(true)}
                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Edit
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Tasks
            </h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4">
                <KanbanColumn
                  title="Backlog"
                  status={TaskStatus.BACKLOG}
                  tasks={project.tasks.backlog}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  projectId={project.id}
                />
                <KanbanColumn
                  title="In Progress"
                  status={TaskStatus.IN_PROGRESS}
                  tasks={project.tasks.in_progress}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  projectId={project.id}
                />
                <KanbanColumn
                  title="Completed"
                  status={TaskStatus.COMPLETED}
                  tasks={project.tasks.completed}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  projectId={project.id}
                />
              </div>
            </DndContext>

            {/* Clear Completed Button */}
            {project.tasks.completed.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleClearCompleted}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Clear All Completed ({project.tasks.completed.length})
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Notes
            </h2>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {project.notes.length > 0 ? (
                <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-sans">
                  {project.notes[0].content}
                </pre>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic text-sm">
                  No notes yet
                </p>
              )}
              <button
                onClick={() => setNotesModalOpen(true)}
                className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TaskModal
        task={editingTask}
        projectId={project?.id || ''}
        defaultStatus={defaultTaskStatus}
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(undefined);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <ObjectiveModal
        objective={project?.objective || null}
        isOpen={objectiveModalOpen}
        onClose={() => setObjectiveModalOpen(false)}
        onSave={handleSaveObjective}
      />

      <NotesModal
        note={project?.notes[0] || null}
        isOpen={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        onSave={handleSaveNotes}
      />
    </div>
  );
}
