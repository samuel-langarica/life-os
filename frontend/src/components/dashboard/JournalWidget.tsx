'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { BookOpen, Flame, Sunrise, Moon } from 'lucide-react';
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
      <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-secondary rounded-lg">
            <BookOpen size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Journal</h2>
        </div>
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-lg">
            <BookOpen size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Journal</h2>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {/* Morning Pages */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sunrise size={16} className="text-muted-foreground" />
            <span className="text-sm">Morning pages</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame size={16} className="text-primary" />
            <span className="text-sm font-medium tabular-nums">{status?.morning_pages_streak || 0}</span>
          </div>
        </div>

        {/* Daily Reflection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon size={16} className="text-muted-foreground" />
            <span className="text-sm">Daily reflection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame size={16} className="text-primary" />
            <span className="text-sm font-medium tabular-nums">{status?.daily_reflection_streak || 0}</span>
          </div>
        </div>
      </div>

      <Link
        href="/journal"
        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        Write now →
      </Link>
    </div>
  );
}
