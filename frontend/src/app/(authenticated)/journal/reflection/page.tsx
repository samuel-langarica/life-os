'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { journalApi } from '@/lib/api/journal';

export default function DailyReflectionPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const today = new Date().toISOString().split('T')[0];

  const { data: existingEntry, isLoading } = useSWR(
    `/api/v1/journal/daily_reflection/${today}`,
    () => journalApi.getByTypeAndDate('daily_reflection', today)
  );

  const [wentWell, setWentWell] = useState('');
  const [improve, setImprove] = useState('');
  const [grateful, setGrateful] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingEntry) {
      setWentWell(existingEntry.content.went_well || '');
      setImprove(existingEntry.content.improve || '');
      setGrateful(existingEntry.content.grateful || '');
    }
  }, [existingEntry]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const content = {
        went_well: wentWell,
        improve: improve,
        grateful: grateful,
      };

      if (existingEntry) {
        await journalApi.update(existingEntry.id, content);
      } else {
        await journalApi.create({
          entry_type: 'daily_reflection',
          entry_date: today,
          content,
        });
      }

      mutate(`/api/v1/journal/daily_reflection/${today}`);
      mutate('/api/v1/journal/status');
      router.push('/journal');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save reflection. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          🌙 Daily Reflection
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="space-y-6">
        {/* What went well */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <label className="block text-lg font-semibold mb-3">
            What went well today?
          </label>
          <textarea
            value={wentWell}
            onChange={(e) => setWentWell(e.target.value)}
            placeholder="Share your wins and positive moments..."
            className="w-full h-32 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* What could be improved */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <label className="block text-lg font-semibold mb-3">
            What could be improved?
          </label>
          <textarea
            value={improve}
            onChange={(e) => setImprove(e.target.value)}
            placeholder="What would you do differently?"
            className="w-full h-32 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* What am I grateful for */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <label className="block text-lg font-semibold mb-3">
            What am I grateful for?
          </label>
          <textarea
            value={grateful}
            onChange={(e) => setGrateful(e.target.value)}
            placeholder="Express gratitude for today..."
            className="w-full h-32 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSaving ? 'Saving...' : 'Save Reflection'}
          </button>
          <button
            onClick={() => router.push('/journal')}
            className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
