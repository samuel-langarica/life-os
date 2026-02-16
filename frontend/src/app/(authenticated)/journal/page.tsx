'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { journalApi, type JournalEntry } from '@/lib/api/journal';
import { formatDate } from '@/lib/utils';

export default function JournalPage() {
  const { data: status, isLoading: statusLoading } = useSWR(
    '/api/v1/journal/status',
    () => journalApi.getStatus()
  );

  const today = new Date().toISOString().split('T')[0];

  const { data: todayMorningPages } = useSWR(
    `/api/v1/journal/morning_pages/${today}`,
    () => journalApi.getByTypeAndDate('morning_pages', today)
  );

  const { data: todayReflection } = useSWR(
    `/api/v1/journal/daily_reflection/${today}`,
    () => journalApi.getByTypeAndDate('daily_reflection', today)
  );

  const { data: entries } = useSWR(
    '/api/v1/journal/entries/recent',
    () => journalApi.list()
  );

  const recentEntries = entries?.entries.slice(0, 10) || [];

  const getEntryTypeDisplay = (type: string) => {
    const displays: Record<string, { icon: string; label: string; color: string }> = {
      morning_pages: { icon: '🌅', label: 'Morning Pages', color: 'text-purple-600 bg-purple-50' },
      daily_reflection: { icon: '🌙', label: 'Daily Reflection', color: 'text-blue-600 bg-blue-50' },
      weekly_review: { icon: '📝', label: 'Weekly Review', color: 'text-green-600 bg-green-50' },
    };
    return displays[type] || displays.morning_pages;
  };

  if (statusLoading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Journal</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Journal</h1>
        <p className="text-muted-foreground mt-1">Morning pages, reflections, and weekly reviews</p>
      </div>

      {/* Today's Status */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                🌅 Morning Pages
              </h2>
              <p className="text-sm text-muted-foreground">
                {status?.morning_pages_streak || 0} day streak 🔥
              </p>
            </div>
            {todayMorningPages ? (
              <span className="text-green-600 text-2xl">✓</span>
            ) : (
              <span className="text-gray-300 text-2xl">○</span>
            )}
          </div>
          <Link
            href="/journal/morning-pages"
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            {todayMorningPages ? 'Read Entry' : 'Write Now'}
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                🌙 Daily Reflection
              </h2>
              <p className="text-sm text-muted-foreground">
                {status?.daily_reflection_streak || 0} day streak 🔥
              </p>
            </div>
            {todayReflection ? (
              <span className="text-green-600 text-2xl">✓</span>
            ) : (
              <span className="text-gray-300 text-2xl">○</span>
            )}
          </div>
          <Link
            href="/journal/reflection"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {todayReflection ? 'Read Entry' : 'Write Now'}
          </Link>
        </div>
      </div>

      {/* This Week */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">This Week</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Entries written this week</p>
              <p className="text-sm text-muted-foreground">{status?.entries_this_week || 0} entries</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sunday Review</p>
              <p className="text-sm text-muted-foreground">
                {status?.weekly_review_completed ? 'Completed ✓' : 'Not done yet'}
              </p>
            </div>
            <Link
              href="/journal/weekly-review"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              {status?.weekly_review_completed ? 'View Review' : 'Start Review'}
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Entries</h2>
          <Link
            href="/journal/timeline"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        {recentEntries.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No entries yet. Start writing!</p>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry: JournalEntry) => {
              const display = getEntryTypeDisplay(entry.entry_type);
              return (
                <Link
                  key={entry.id}
                  href={`/journal/entry/${entry.id}`}
                  className="block p-3 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{display.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${display.color}`}>
                          {display.label}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
