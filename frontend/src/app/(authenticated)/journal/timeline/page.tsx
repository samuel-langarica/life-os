'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { journalApi, type JournalEntry, type EntryType } from '@/lib/api/journal';

export default function TimelinePage() {
  const [filterType, setFilterType] = useState<EntryType | 'all'>('all');

  const { data, isLoading } = useSWR(
    ['/api/v1/journal/timeline', filterType],
    () => journalApi.list(filterType === 'all' ? {} : { entry_type: filterType })
  );

  const entries = data?.entries || [];

  const getEntryTypeDisplay = (type: string) => {
    const displays: Record<string, { icon: string; label: string; color: string }> = {
      morning_pages: { icon: '🌅', label: 'Morning Pages', color: 'bg-purple-100 text-purple-800' },
      daily_reflection: { icon: '🌙', label: 'Daily Reflection', color: 'bg-blue-100 text-blue-800' },
      weekly_review: { icon: '📝', label: 'Weekly Review', color: 'bg-green-100 text-green-800' },
    };
    return displays[type] || displays.morning_pages;
  };

  const groupByMonth = (entries: JournalEntry[]) => {
    const grouped: Record<string, JournalEntry[]> = {};

    entries.forEach((entry) => {
      const date = new Date(entry.entry_date);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(entry);
    });

    return grouped;
  };

  const groupedEntries = groupByMonth(entries);

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Timeline</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Timeline</h1>
        <p className="text-muted-foreground mt-1">Browse all your journal entries</p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filterType === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('morning_pages')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filterType === 'morning_pages'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          🌅 Morning Pages
        </button>
        <button
          onClick={() => setFilterType('daily_reflection')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filterType === 'daily_reflection'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          🌙 Reflections
        </button>
        <button
          onClick={() => setFilterType('weekly_review')}
          className={`px-4 py-2 rounded-md transition-colors ${
            filterType === 'weekly_review'
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          📝 Reviews
        </button>
      </div>

      {/* Timeline */}
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No entries found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEntries).map(([month, monthEntries]) => (
            <div key={month}>
              <h2 className="text-xl font-bold text-foreground mb-4">{month}</h2>
              <div className="space-y-3">
                {monthEntries.map((entry) => {
                  const display = getEntryTypeDisplay(entry.entry_type);
                  const previewText = entry.entry_type === 'morning_pages'
                    ? entry.content.content?.substring(0, 150)
                    : entry.entry_type === 'daily_reflection'
                    ? entry.content.went_well?.substring(0, 150)
                    : entry.content.wins?.substring(0, 150);

                  return (
                    <Link
                      key={entry.id}
                      href={
                        entry.entry_type === 'morning_pages'
                          ? '/journal/morning-pages'
                          : entry.entry_type === 'daily_reflection'
                          ? '/journal/reflection'
                          : '/journal/weekly-review'
                      }
                      className="block bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">{display.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${display.color}`}>
                              {display.label}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(entry.entry_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          {previewText && (
                            <p className="text-gray-700 text-sm line-clamp-2">
                              {previewText}
                              {previewText.length >= 150 ? '...' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
