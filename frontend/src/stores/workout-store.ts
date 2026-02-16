import { create } from 'zustand';

interface WorkoutState {
  sessionId: string | null;
  elapsedSeconds: number;
  isRunning: boolean;
  intervalId: number | null;
  startSession: (sessionId: string) => void;
  tick: () => void;
  stopSession: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  sessionId: null,
  elapsedSeconds: 0,
  isRunning: false,
  intervalId: null,

  startSession: (sessionId) => {
    const id = window.setInterval(() => get().tick(), 1000);
    set({ sessionId, elapsedSeconds: 0, isRunning: true, intervalId: id });
  },

  tick: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),

  stopSession: () => {
    const { intervalId } = get();
    if (intervalId) window.clearInterval(intervalId);
    set({ sessionId: null, isRunning: false, intervalId: null });
  },
}));
