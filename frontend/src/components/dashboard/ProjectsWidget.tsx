'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { projectsApi } from '@/lib/api/projects';

export function ProjectsWidget() {
  const { data: projects, isLoading } = useSWR('/api/v1/projects', projectsApi.list);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Objectives</CardTitle>
        <CardDescription>Your active project goals</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No projects yet</p>
            <Link
              href="/projects"
              className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const inProgressCount = project.tasks?.in_progress?.length || 0;
              const backlogCount = project.tasks?.backlog?.length || 0;
              const completedCount = project.tasks?.completed?.length || 0;
              const totalTasks = inProgressCount + backlogCount + completedCount;

              return (
                <div key={project.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {project.objective || (
                          <span className="italic text-gray-400 dark:text-gray-500">
                            No objective set
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {inProgressCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            {inProgressCount} in progress
                          </span>
                        )}
                        {backlogCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full" />
                            {backlogCount} backlog
                          </span>
                        )}
                        {completedCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            {completedCount} completed
                          </span>
                        )}
                        {totalTasks === 0 && (
                          <span className="text-gray-400 dark:text-gray-500">No tasks</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <Link
              href="/projects"
              className="block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-4"
            >
              Manage Projects →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
