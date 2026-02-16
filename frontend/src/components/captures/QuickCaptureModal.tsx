'use client';

import { useState, useEffect, useRef } from 'react';
import { useCaptureStore } from '@/stores/capture-store';
import { capturesApi } from '@/lib/api/captures';
import { Button } from '@/components/ui/button';
import { useSWRConfig } from 'swr';

export function QuickCaptureModal() {
  const isModalOpen = useCaptureStore((state) => state.isModalOpen);
  const closeModal = useCaptureStore((state) => state.closeModal);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate } = useSWRConfig();

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isModalOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isModalOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  const handleClose = () => {
    if (!isSubmitting) {
      setText('');
      closeModal();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await capturesApi.create(text.trim(), 'manual');

      // Mutate SWR cache to refresh captures list and count
      mutate('/api/v1/captures');
      mutate('/api/v1/captures/count');

      // Close modal and clear text
      setText('');
      closeModal();
    } catch (error) {
      console.error('Failed to create capture:', error);
      alert('Failed to save capture. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 z-10">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Quick Capture</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={6}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!text.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save to Inbox'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
