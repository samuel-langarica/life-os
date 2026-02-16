'use client';

import { Plus } from 'lucide-react';
import { useCaptureStore } from '@/stores/capture-store';

export function FloatingCaptureButton() {
  const openModal = useCaptureStore((state) => state.openModal);

  return (
    <button
      onClick={openModal}
      className="fixed bottom-20 right-6 md:bottom-6 md:right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 hover:scale-105 transition-all duration-200 flex items-center justify-center z-40 group"
      aria-label="Quick Capture"
    >
      <Plus size={24} className="group-hover:rotate-90 transition-transform duration-200" />
    </button>
  );
}
