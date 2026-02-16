'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { journalApi } from '@/lib/api/journal';

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export default function WeeklyReviewPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const weekStart = getWeekStart(new Date());

  const { data: existingEntry, isLoading } = useSWR(
    `/api/v1/journal/weekly_review/${weekStart}`,
    () => journalApi.getByTypeAndDate('weekly_review', weekStart)
  );

  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [learnings, setLearnings] = useState('');
  const [focus, setFocus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingEntry) {
      setWins(existingEntry.content.wins || '');
      setChallenges(existingEntry.content.challenges || '');
      setLearnings(existingEntry.content.learnings || '');
      setFocus(existingEntry.content.focus || '');
    }
  }, [existingEntry]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const content = {
        wins,
        challenges,
        learnings,
        focus,
      };

      if (existingEntry) {
        await journalApi.update(existingEntry.id, content);
      } else {
        await journalApi.create({
          entry_type: 'weekly_review',
          entry_date: weekStart,
          content,
        });
      }

      mutate(`/api/v1/journal/weekly_review/${weekStart}`);
      mutate('/api/v1/journal/status');
      router.push('/journal');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save weekly review. Please try again.');
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
          📝 Weekly Review
        </h1>
        <p className="text-muted-foreground mt-1">
          Week of {new Date(weekStart).toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-6">
        {/* Big wins */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <label className="block text-lg font-semibold mb-3">
            Big wins this week?
          </label>
          <textarea
            value={wins}
            onChange={(e) => setWins(e.target.value)}
            placeholder="What are you proud of accomplishing?"
            className="w-full h-32 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* Challenges */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <label className="block text-lg font-semibold mb-3">
            Challenges faced?
          </label>
          <textarea
            value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            placeholder="What obstacles did you encounter?"
            className="w-full h-32 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* Key learnings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <label className="block text-lg font-semibold mb-3">
            Key learnings?
          </label>
          <textarea
            value={learnings}
            onChange={(e) => setLearnings(e.target.value)}
            placeholder="What did you learn this week?"
            className="w-full h-32 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* Next week focus */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <label className="block text-lg font-semibold mb-3">
            Focus for next week?
          </label>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="What will you prioritize?"
            className="w-full h-32 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSaving ? 'Saving...' : 'Save Review'}
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
