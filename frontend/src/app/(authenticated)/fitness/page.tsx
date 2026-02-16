'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { Dumbbell, Play, Plus, Trash2, ChevronRight, Check, Circle, Clock, Settings } from 'lucide-react';
import { fitnessApi, type ProgramListItem, type FitnessSummary } from '@/lib/api/fitness';
import { ROUTES } from '@/lib/constants';

export default function FitnessPage() {
  const [showNewProgram, setShowNewProgram] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  const [newProgramDesc, setNewProgramDesc] = useState('');

  const { data: summary, isLoading: summaryLoading } = useSWR(
    '/api/v1/workouts/summary',
    fitnessApi.getSummary
  );

  const { data: programs, isLoading: programsLoading } = useSWR(
    '/api/v1/programs',
    fitnessApi.listPrograms
  );

  const { data: history } = useSWR(
    '/api/v1/workouts/history?per_page=5',
    () => fitnessApi.getHistory({ per_page: 5 })
  );

  const isLoading = summaryLoading || programsLoading;

  const handleCreateProgram = async () => {
    if (!newProgramName.trim()) return;
    try {
      await fitnessApi.createProgram({
        name: newProgramName.trim(),
        description: newProgramDesc.trim() || undefined,
        is_active: !programs?.items.length,
      });
      setNewProgramName('');
      setNewProgramDesc('');
      setShowNewProgram(false);
      mutate('/api/v1/programs');
      mutate('/api/v1/workouts/summary');
    } catch (err) {
      console.error('Failed to create program:', err);
    }
  };

  const handleActivateProgram = async (id: string) => {
    try {
      await fitnessApi.updateProgram(id, { is_active: true });
      mutate('/api/v1/programs');
      mutate('/api/v1/workouts/summary');
    } catch (err) {
      console.error('Failed to activate program:', err);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      await fitnessApi.deleteProgram(id);
      mutate('/api/v1/programs');
      mutate('/api/v1/workouts/summary');
    } catch (err) {
      console.error('Failed to delete program:', err);
    }
  };

  const handleStartWorkout = async (programId: string, dayLabel: string) => {
    try {
      const session = await fitnessApi.startSession({
        program_id: programId,
        day_label: dayLabel,
      });
      window.location.href = ROUTES.FITNESS_SESSION;
    } catch (err) {
      console.error('Failed to start workout:', err);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  // Week visualization
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const getWeekWorkoutDays = () => {
    if (!summary?.workouts_this_week) return new Set<number>();
    const days = new Set<number>();
    summary.workouts_this_week.forEach((dateStr) => {
      const d = new Date(dateStr);
      // getDay() returns 0=Sun, we want 0=Mon
      const day = (d.getDay() + 6) % 7;
      days.add(day);
    });
    return days;
  };
  const completedDays = getWeekWorkoutDays();

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Fitness</h1>
          <p className="text-muted-foreground">Loading...</p>
        </header>
      </div>
    );
  }

  const activeProgram = programs?.items.find((p) => p.is_active);

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Fitness</h1>
        <p className="text-muted-foreground">Workout programs and exercise tracking</p>
      </header>

      {/* Active Session Banner */}
      {summary?.has_active_session && (
        <Link
          href={ROUTES.FITNESS_SESSION}
          className="block mb-6 bg-primary/10 border border-primary/20 rounded-xl p-4 hover:bg-primary/15 transition-all duration-150"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Play size={16} className="text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">Workout in progress</p>
                <p className="text-xs text-muted-foreground">Tap to resume</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-primary" />
          </div>
        </Link>
      )}

      {/* Active Program Card */}
      {activeProgram ? (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Active Program</p>
              <h2 className="text-lg font-semibold mt-1">{activeProgram.name}</h2>
              {summary?.next_day_label && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Next: {summary.next_day_label}
                </p>
              )}
            </div>
            {!summary?.has_active_session && summary?.next_day_label && summary?.active_program_id && (
              <button
                onClick={() => handleStartWorkout(summary.active_program_id!, summary.next_day_label!)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-150 font-medium text-sm"
              >
                <Play size={16} />
                Start Workout
              </button>
            )}
          </div>

          {/* This Week */}
          <div className="flex items-center gap-4 mb-4">
            <p className="text-sm font-medium text-muted-foreground">This Week</p>
            <div className="flex gap-2">
              {daysOfWeek.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{day}</span>
                  {completedDays.has(idx) ? (
                    <Check size={16} className="text-primary" />
                  ) : (
                    <Circle size={16} className="text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Day Labels - Start specific day */}
          {activeProgram.day_labels.length > 0 && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Workout Days</p>
              <div className="space-y-1">
                {activeProgram.day_labels.map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-sm">{label}</span>
                    {!summary?.has_active_session && (
                      <button
                        onClick={() => handleStartWorkout(activeProgram.id, label)}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        Start
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <Link
              href={`/fitness/programs?id=${activeProgram.id}`}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Edit program →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 mb-6 text-center">
          <Dumbbell size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No active program. Create one to get started.</p>
        </div>
      )}

      {/* Programs Section */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Programs</h2>
          <button
            onClick={() => setShowNewProgram(true)}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Plus size={16} />
            Add Program
          </button>
        </div>

        {showNewProgram && (
          <div className="mb-4 p-4 bg-secondary/30 rounded-lg border border-border">
            <input
              type="text"
              placeholder="Program name"
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newProgramDesc}
              onChange={(e) => setNewProgramDesc(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateProgram}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => { setShowNewProgram(false); setNewProgramName(''); setNewProgramDesc(''); }}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!programs?.items.length ? (
          <p className="text-sm text-muted-foreground">No programs yet</p>
        ) : (
          <div className="space-y-2">
            {programs.items.map((program) => (
              <div
                key={program.id}
                className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{program.name}</span>
                    {program.is_active && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
                        active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {program.exercise_count} exercises · {program.day_labels.length} days
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!program.is_active && (
                    <button
                      onClick={() => handleActivateProgram(program.id)}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      Activate
                    </button>
                  )}
                  <Link
                    href={`/fitness/programs?id=${program.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings size={14} />
                  </Link>
                  <button
                    onClick={() => handleDeleteProgram(program.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent History */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">History</h2>
          <Link
            href={ROUTES.FITNESS_HISTORY}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            View All →
          </Link>
        </div>
        {!history?.items.length ? (
          <p className="text-center py-6 text-muted-foreground text-sm">No workouts yet. Start your first one!</p>
        ) : (
          <div className="space-y-2">
            {history.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">
                    {item.day_label || 'Workout'}
                    {item.program_name && (
                      <span className="text-muted-foreground font-normal"> · {item.program_name}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {new Date(item.started_at).toLocaleDateString()} · {item.exercise_count} exercises
                    {item.duration_seconds && ` · ${formatDuration(item.duration_seconds)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
