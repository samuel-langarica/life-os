'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { useRouter } from 'next/navigation';
import { X, Check, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import { fitnessApi, type SessionActiveResponse, type SessionExerciseInfo, type WorkoutLog } from '@/lib/api/fitness';
import { ROUTES } from '@/lib/constants';

export default function WorkoutSessionPage() {
  const router = useRouter();
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, Record<number, number>>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completionResult, setCompletionResult] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: session, error, isLoading } = useSWR(
    '/api/v1/workouts/sessions/active',
    fitnessApi.getActiveSession,
    { revalidateOnFocus: false }
  );

  // Timer
  useEffect(() => {
    if (session?.started_at) {
      const start = new Date(session.started_at).getTime();
      const updateTimer = () => {
        setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [session?.started_at]);

  // Initialize completed sets from existing logs
  useEffect(() => {
    if (session?.logs) {
      const sets: Record<string, Record<number, number>> = {};
      session.logs.forEach((log) => {
        if (!sets[log.exercise_id]) sets[log.exercise_id] = {};
        sets[log.exercise_id][log.set_number] = log.reps;
      });
      setCompletedSets(sets);
    }
  }, [session?.logs]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogSet = useCallback(async (exerciseId: string, setNumber: number, targetRepsMin: number) => {
    if (!session) return;
    // If already completed, skip
    if (completedSets[exerciseId]?.[setNumber] !== undefined) return;

    try {
      await fitnessApi.logSet(session.id, {
        exercise_id: exerciseId,
        set_number: setNumber,
        reps: targetRepsMin,
      });
      setCompletedSets((prev) => ({
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          [setNumber]: targetRepsMin,
        },
      }));
    } catch (err) {
      console.error('Failed to log set:', err);
    }
  }, [session, completedSets]);

  const handleComplete = async () => {
    if (!session) return;
    setCompleting(true);
    try {
      const result = await fitnessApi.completeSession(session.id, completeNotes || undefined);
      setCompletionResult(result);
      mutate('/api/v1/workouts/summary');
      mutate('/api/v1/workouts/history?per_page=5');
    } catch (err) {
      console.error('Failed to complete session:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = async () => {
    if (!session) return;
    if (!confirm('Discard this workout?')) return;
    try {
      await fitnessApi.cancelSession(session.id);
      mutate('/api/v1/workouts/summary');
      router.push(ROUTES.FITNESS);
    } catch (err) {
      console.error('Failed to cancel session:', err);
    }
  };

  // No active session
  if (error || (!isLoading && !session)) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">No active workout session</p>
        <button
          onClick={() => router.push(ROUTES.FITNESS)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
        >
          Go to Fitness
        </button>
      </div>
    );
  }

  if (isLoading || !session) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12 text-muted-foreground">Loading session...</div>
      </div>
    );
  }

  // Completion screen
  if (completionResult) {
    return (
      <div className="animate-fade-in max-w-lg mx-auto">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Workout Complete!</h1>
          <p className="text-muted-foreground mb-1">
            {completionResult.day_label || 'Workout'}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            Duration: {Math.floor(completionResult.duration_seconds / 60)} minutes
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Summary</h2>
          <div className="space-y-3">
            {completionResult.summary.map((ex: any) => (
              <div key={ex.exercise_name} className="flex items-center justify-between">
                <span className="text-sm font-medium">{ex.exercise_name}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {ex.sets_completed} x {ex.reps_per_set.join('/')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push(ROUTES.FITNESS)}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  const exercises = session.exercises;
  const currentExercise = exercises[currentExerciseIdx];
  const isLastExercise = currentExerciseIdx === exercises.length - 1;

  // Check if all sets for current exercise are done
  const currentExerciseSetsCompleted = currentExercise
    ? Array.from({ length: currentExercise.target_sets }, (_, i) => i + 1).every(
        (setNum) => completedSets[currentExercise.exercise_id]?.[setNum] !== undefined
      )
    : false;

  // Check if all exercises are done
  const allDone = exercises.every((ex) =>
    Array.from({ length: ex.target_sets }, (_, i) => i + 1).every(
      (setNum) => completedSets[ex.exercise_id]?.[setNum] !== undefined
    )
  );

  return (
    <div className="animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleCancel}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={24} />
        </button>
        <div className="flex items-center gap-2 text-sm tabular-nums">
          <Clock size={16} className="text-primary" />
          <span className="font-mono font-medium">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Session Info */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          {session.day_label || 'Workout'} — Exercise {currentExerciseIdx + 1} of {exercises.length}
        </p>
      </div>

      {/* Exercise Navigation Dots */}
      {exercises.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {exercises.map((_, idx) => {
            const ex = exercises[idx];
            const done = Array.from({ length: ex.target_sets }, (_, i) => i + 1).every(
              (setNum) => completedSets[ex.exercise_id]?.[setNum] !== undefined
            );
            return (
              <button
                key={idx}
                onClick={() => setCurrentExerciseIdx(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentExerciseIdx
                    ? 'w-6 bg-primary'
                    : done
                    ? 'bg-primary/50'
                    : 'bg-muted-foreground/30'
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Current Exercise */}
      {currentExercise && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-1">{currentExercise.exercise_name}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Target: {currentExercise.target_sets} sets x {currentExercise.target_reps_min}
            {currentExercise.target_reps_max !== currentExercise.target_reps_min && `-${currentExercise.target_reps_max}`} reps
          </p>

          {/* Sets */}
          <div className="space-y-3">
            {Array.from({ length: currentExercise.target_sets }, (_, i) => i + 1).map((setNum) => {
              const isCompleted = completedSets[currentExercise.exercise_id]?.[setNum] !== undefined;
              const reps = completedSets[currentExercise.exercise_id]?.[setNum];

              return (
                <div
                  key={setNum}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    isCompleted
                      ? 'bg-primary/5 border-primary/20'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-12">Set {setNum}</span>
                    {isCompleted ? (
                      <span className="text-sm font-medium tabular-nums">{reps} reps</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {currentExercise.target_reps_min}-{currentExercise.target_reps_max} reps
                      </span>
                    )}
                  </div>
                  {isCompleted ? (
                    <Check size={20} className="text-primary" />
                  ) : (
                    <button
                      onClick={() => handleLogSet(currentExercise.exercise_id, setNum, currentExercise.target_reps_min)}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Complete
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {currentExercise.rest_seconds > 0 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Rest: {currentExercise.rest_seconds}s between sets
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentExerciseIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentExerciseIdx === 0}
          className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {allDone || showComplete ? (
          <div className="flex-1 mx-4">
            {!showComplete ? (
              <button
                onClick={() => setShowComplete(true)}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors"
              >
                Finish Workout
              </button>
            ) : (
              <div className="bg-card border border-border rounded-xl p-4">
                <textarea
                  placeholder="Notes (optional)"
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mb-3 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {completing ? 'Saving...' : 'Save Workout'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setCurrentExerciseIdx((prev) => Math.min(exercises.length - 1, prev + 1))}
            disabled={isLastExercise}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
