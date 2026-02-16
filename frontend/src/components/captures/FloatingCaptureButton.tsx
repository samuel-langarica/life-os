'use client';

import { useCaptureStore } from '@/stores/capture-store';

export function FloatingCaptureButton() {
  const openModal = useCaptureStore((state) => state.openModal);

  return (
    <button
      onClick={openModal}
      className="fixed bottom-20 md:bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors flex items-center justify-center"
      aria-label="Quick capture"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>
  );
}
