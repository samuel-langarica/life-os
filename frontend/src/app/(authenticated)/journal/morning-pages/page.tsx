'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { journalApi, type JournalEntry } from '@/lib/api/journal';

export default function MorningPagesPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const today = new Date().toISOString().split('T')[0];

  const { data: existingEntry, isLoading } = useSWR(
    `/api/v1/journal/morning_pages/${today}`,
    () => journalApi.getByTypeAndDate('morning_pages', today)
  );

  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (existingEntry) {
      setContent(existingEntry.content.content || '');
    }
  }, [existingEntry]);

  const saveEntry = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      if (existingEntry) {
        await journalApi.update(existingEntry.id, { content: text });
      } else {
        await journalApi.create({
          entry_type: 'morning_pages',
          entry_date: today,
          content: { content: text },
        });
      }

      setSaveStatus('saved');
      mutate(`/api/v1/journal/morning_pages/${today}`);
      mutate('/api/v1/journal/status');

      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [existingEntry, today, mutate]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for auto-save (2 seconds after typing stops)
    const timeout = setTimeout(() => {
      saveEntry(newContent);
    }, 2000);

    setSaveTimeout(timeout);
  };

  const handleManualSave = async () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    await saveEntry(content);
  };

  const characterCount = content.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              🌅 Morning Pages
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {characterCount} characters
            </span>
            {saveStatus === 'saving' && (
              <span className="text-sm text-blue-600">Saving...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-sm text-green-600">Saved ✓</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-600">Error saving</span>
            )}
            <button
              onClick={handleManualSave}
              disabled={isSaving || !content.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={() => router.push('/journal')}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing your morning pages..."
            className="w-full h-full min-h-[600px] p-6 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-lg leading-relaxed"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
