'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Target } from 'lucide-react';
import { projectsApi } from '@/lib/api/projects';

export function ProjectsWidget() {
  const { data: projects, isLoading } = useSWR('/api/v1/projects', projectsApi.list);

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200 animate-slide-up" style={{ animationDelay: '150ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-lg">
            <Target size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Projects</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">No projects yet</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {projects.map((project) => {
            const inProgressCount = project.tasks?.in_progress?.length || 0;

            return (
              <div key={project.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{project.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                      {project.objective || 'No objective set'}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 tabular-nums">
                      {inProgressCount} in progress
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/projects"
        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Manage projects →
      </Link>
    </div>
  );
}
