'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Dumbbell, Check, Circle, Play } from 'lucide-react';
import { fitnessApi } from '@/lib/api/fitness';
import { ROUTES } from '@/lib/constants';

export function FitnessWidget() {
  const { data: summary, isLoading } = useSWR(
    '/api/v1/workouts/summary',
    fitnessApi.getSummary
  );

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getCompletedDays = () => {
    if (!summary?.workouts_this_week) return new Set<number>();
    const days = new Set<number>();
    summary.workouts_this_week.forEach((dateStr) => {
      const d = new Date(dateStr);
      const day = (d.getDay() + 6) % 7;
      days.add(day);
    });
    return days;
  };

  const completedDays = getCompletedDays();

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200 animate-slide-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-lg">
            <Dumbbell size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Fitness</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Active Session */}
          {summary?.has_active_session && (
            <Link
              href={ROUTES.FITNESS_SESSION}
              className="block mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/15 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Play size={14} className="text-primary" />
                <span className="text-sm font-medium">Workout in progress</span>
              </div>
            </Link>
          )}

          {/* Week Progress */}
          <div className="flex justify-center gap-3 mb-4">
            {daysOfWeek.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{day}</span>
                {completedDays.has(idx) ? (
                  <Check size={14} className="text-primary" />
                ) : (
                  <Circle size={14} className="text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>

          {/* Active Program */}
          {summary?.active_program_name ? (
            <div className="mb-4">
              <p className="text-sm font-medium">{summary.active_program_name}</p>
              {summary.next_day_label && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Next: {summary.next_day_label}
                </p>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">No active program</p>
            </div>
          )}
        </>
      )}

      <Link
        href={ROUTES.FITNESS}
        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {summary?.has_active_session ? 'Resume workout →' : 'Go to fitness →'}
      </Link>
    </div>
  );
}
