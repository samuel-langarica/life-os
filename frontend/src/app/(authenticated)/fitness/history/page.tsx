'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { fitnessApi } from '@/lib/api/fitness';
import { ROUTES } from '@/lib/constants';

export default function FitnessHistoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data: history, isLoading } = useSWR(
    `/api/v1/workouts/history?page=${page}&per_page=${perPage}`,
    () => fitnessApi.getHistory({ page, per_page: perPage })
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  const totalPages = history ? Math.ceil(history.total / perPage) : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(ROUTES.FITNESS)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold">Workout History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {history?.total || 0} completed workouts
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !history?.items.length ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted-foreground">No completed workouts yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {history.items.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {item.day_label || 'Workout'}
                      {item.program_name && (
                        <span className="text-muted-foreground font-normal"> · {item.program_name}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                      {new Date(item.started_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {item.duration_seconds && ` · ${formatDuration(item.duration_seconds)}`}
                      {` · ${item.exercise_count} exercises`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm text-muted-foreground tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
