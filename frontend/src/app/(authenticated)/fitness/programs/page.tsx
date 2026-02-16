'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import {
  fitnessApi,
  type ProgramDetail,
  type ProgramExerciseEntry,
  type Exercise,
} from '@/lib/api/fitness';
import { ROUTES } from '@/lib/constants';

export default function ProgramsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = searchParams.get('id');

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedDayLabel, setSelectedDayLabel] = useState('');
  const [newDayLabel, setNewDayLabel] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [targetSets, setTargetSets] = useState(3);
  const [targetRepsMin, setTargetRepsMin] = useState(8);
  const [targetRepsMax, setTargetRepsMax] = useState(12);
  const [restSeconds, setRestSeconds] = useState(90);

  // New exercise creation
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');

  const { data: program, isLoading } = useSWR(
    programId ? `/api/v1/programs/${programId}` : null,
    () => (programId ? fitnessApi.getProgram(programId) : null)
  );

  const { data: exerciseList } = useSWR(
    '/api/v1/exercises',
    () => fitnessApi.listExercises()
  );

  if (!programId) {
    router.push(ROUTES.FITNESS);
    return null;
  }

  const handleAddExercise = async () => {
    if (!selectedExerciseId || !selectedDayLabel) return;
    const dayLabel = selectedDayLabel === '__new__' ? newDayLabel.trim() : selectedDayLabel;
    if (!dayLabel) return;

    try {
      await fitnessApi.addProgramExercise(programId, {
        exercise_id: selectedExerciseId,
        day_label: dayLabel,
        target_sets: targetSets,
        target_reps_min: targetRepsMin,
        target_reps_max: targetRepsMax,
        rest_seconds: restSeconds,
      });
      setShowAddExercise(false);
      setSelectedExerciseId('');
      setSelectedDayLabel('');
      setNewDayLabel('');
      setTargetSets(3);
      setTargetRepsMin(8);
      setTargetRepsMax(12);
      setRestSeconds(90);
      mutate(`/api/v1/programs/${programId}`);
      mutate('/api/v1/programs');
    } catch (err) {
      console.error('Failed to add exercise:', err);
    }
  };

  const handleRemoveExercise = async (entryId: string) => {
    try {
      await fitnessApi.deleteProgramExercise(programId, entryId);
      mutate(`/api/v1/programs/${programId}`);
      mutate('/api/v1/programs');
    } catch (err) {
      console.error('Failed to remove exercise:', err);
    }
  };

  const handleCreateExercise = async () => {
    if (!newExName.trim()) return;
    try {
      const ex = await fitnessApi.createExercise({
        name: newExName.trim(),
        muscle_group: newExMuscle.trim() || undefined,
      });
      setNewExName('');
      setNewExMuscle('');
      setShowNewExercise(false);
      setSelectedExerciseId(ex.id);
      mutate('/api/v1/exercises');
    } catch (err) {
      console.error('Failed to create exercise:', err);
    }
  };

  if (isLoading || !program) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12 text-muted-foreground">Loading program...</div>
      </div>
    );
  }

  const dayLabels = Object.keys(program.days);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(ROUTES.FITNESS)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold">{program.name}</h1>
          {program.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{program.description}</p>
          )}
        </div>
      </div>

      {/* Days and Exercises */}
      {dayLabels.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6 text-center mb-6">
          <p className="text-muted-foreground mb-2">No exercises added yet.</p>
          <p className="text-sm text-muted-foreground">Add exercises to build your workout days.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {dayLabels.map((dayLabel) => (
            <div key={dayLabel} className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">{dayLabel}</h2>
              <div className="space-y-2">
                {program.days[dayLabel].map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical size={14} className="text-muted-foreground/30" />
                      <div>
                        <p className="text-sm font-medium">{entry.exercise.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {entry.target_sets} sets x {entry.target_reps_min}
                          {entry.target_reps_max !== entry.target_reps_min && `-${entry.target_reps_max}`} reps
                          {entry.rest_seconds > 0 && ` · ${entry.rest_seconds}s rest`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(entry.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Exercise */}
      {!showAddExercise ? (
        <button
          onClick={() => setShowAddExercise(true)}
          className="w-full py-3 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Exercise
        </button>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Add Exercise to Program</h3>

          {/* Day Label Selection */}
          <div className="mb-3">
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Day</label>
            <select
              value={selectedDayLabel}
              onChange={(e) => setSelectedDayLabel(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select a day...</option>
              {dayLabels.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
              <option value="__new__">+ New day...</option>
            </select>
            {selectedDayLabel === '__new__' && (
              <input
                type="text"
                placeholder="e.g., Upper Body A"
                value={newDayLabel}
                onChange={(e) => setNewDayLabel(e.target.value)}
                className="w-full mt-2 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            )}
          </div>

          {/* Exercise Selection */}
          <div className="mb-3">
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Exercise</label>
            <div className="flex gap-2">
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select exercise...</option>
                {exerciseList?.items.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} {ex.muscle_group && `(${ex.muscle_group})`}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewExercise(true)}
                className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-secondary/50 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* New Exercise Inline Form */}
          {showNewExercise && (
            <div className="mb-3 p-3 bg-secondary/30 rounded-lg border border-border">
              <input
                type="text"
                placeholder="Exercise name"
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <input
                type="text"
                placeholder="Muscle group (e.g., back, chest)"
                value={newExMuscle}
                onChange={(e) => setNewExMuscle(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateExercise}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowNewExercise(false); setNewExName(''); setNewExMuscle(''); }}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Sets and Reps */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Sets</label>
              <input
                type="number"
                value={targetSets}
                onChange={(e) => setTargetSets(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Rest (seconds)</label>
              <input
                type="number"
                value={restSeconds}
                onChange={(e) => setRestSeconds(Number(e.target.value))}
                min={0}
                max={600}
                step={15}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Min Reps</label>
              <input
                type="number"
                value={targetRepsMin}
                onChange={(e) => setTargetRepsMin(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Max Reps</label>
              <input
                type="number"
                value={targetRepsMax}
                onChange={(e) => setTargetRepsMax(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddExercise}
              disabled={!selectedExerciseId || !selectedDayLabel}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Add to Program
            </button>
            <button
              onClick={() => setShowAddExercise(false)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
