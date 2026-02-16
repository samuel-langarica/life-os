'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/lib/api/projects';
import { SortableTaskCard } from './SortableTaskCard';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  projectId: string;
}

const statusColors = {
  [TaskStatus.BACKLOG]: 'bg-gray-50 dark:bg-gray-900',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-50 dark:bg-blue-950/20',
  [TaskStatus.COMPLETED]: 'bg-green-50 dark:bg-green-950/20',
};

const statusBorderColors = {
  [TaskStatus.BACKLOG]: 'border-gray-200 dark:border-gray-700',
  [TaskStatus.IN_PROGRESS]: 'border-blue-200 dark:border-blue-800',
  [TaskStatus.COMPLETED]: 'border-green-200 dark:border-green-800',
};

export function KanbanColumn({
  title,
  status,
  tasks,
  onAddTask,
  onEditTask,
  projectId,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex-1 min-w-[280px]">
      <div
        className={`${statusColors[status]} ${statusBorderColors[status]} border rounded-lg p-4 transition-colors ${
          isOver ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {tasks.length}
          </span>
        </div>

        <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
              />
            ))}
          </SortableContext>
        </div>

        <button
          onClick={() => onAddTask(status)}
          className="w-full mt-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          + Add Task
        </button>
      </div>
    </div>
  );
}
