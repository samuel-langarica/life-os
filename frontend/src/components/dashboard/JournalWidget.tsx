'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { journalApi } from '@/lib/api/journal';

export function JournalWidget() {
  const { data: status, isLoading } = useSWR(
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">📓 Journal Status</h2>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">📓 Journal Status</h2>
        <Link
          href="/journal"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-4">
        {/* Morning Pages */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌅</span>
            <div>
              <p className="font-medium">Morning Pages</p>
              <p className="text-sm text-muted-foreground">
                {status?.morning_pages_streak ? (
                  <span className="text-orange-600 font-semibold">
                    🔥 {status.morning_pages_streak} day streak
                  </span>
                ) : (
                  <span>No streak yet</span>
                )}
              </p>
            </div>
          </div>
          {todayMorningPages ? (
            <span className="text-green-600 text-xl font-bold">✓</span>
          ) : (
            <Link
              href="/journal/morning-pages"
              className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 transition-colors"
            >
              Write
            </Link>
          )}
        </div>

        {/* Daily Reflection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌙</span>
            <div>
              <p className="font-medium">Reflection</p>
              <p className="text-sm text-muted-foreground">
                {status?.daily_reflection_streak ? (
                  <span className="text-orange-600 font-semibold">
                    🔥 {status.daily_reflection_streak} day streak
                  </span>
                ) : (
                  <span>No streak yet</span>
                )}
              </p>
            </div>
          </div>
          {todayReflection ? (
            <span className="text-green-600 text-xl font-bold">✓</span>
          ) : (
            <Link
              href="/journal/reflection"
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Write
            </Link>
          )}
        </div>

        {/* This Week Summary */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Entries this week:</span>
            <span className="font-semibold">{status?.entries_this_week || 0}</span>
          </div>
          {status?.weekly_review_completed && (
            <div className="mt-2">
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                Weekly Review Complete ✓
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
