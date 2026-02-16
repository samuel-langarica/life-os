import { create } from 'zustand';

interface CaptureState {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
