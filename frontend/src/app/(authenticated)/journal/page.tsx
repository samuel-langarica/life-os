'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Sunrise, Moon, Flame, Check, Circle, BookOpen } from 'lucide-react';
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
    const displays: Record<string, { icon: any; label: string; color: string }> = {
      morning_pages: { icon: Sunrise, label: 'Morning Pages', color: 'bg-secondary text-foreground' },
      daily_reflection: { icon: Moon, label: 'Daily Reflection', color: 'bg-secondary text-foreground' },
      weekly_review: { icon: BookOpen, label: 'Weekly Review', color: 'bg-secondary text-foreground' },
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
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Journal</h1>
        <p className="text-muted-foreground">Morning pages, reflections, and weekly reviews</p>
      </header>

      {/* Today's Status */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sunrise size={20} className="text-primary" />
                <h2 className="text-lg font-semibold">Morning Pages</h2>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Flame size={14} className="text-primary" />
                <span className="tabular-nums">{status?.morning_pages_streak || 0} day streak</span>
              </div>
            </div>
            {todayMorningPages ? (
              <Check size={24} className="text-primary" />
            ) : (
              <Circle size={24} className="text-muted-foreground" />
            )}
          </div>
          <Link
            href="/journal/morning-pages"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-150 font-medium text-sm"
          >
            {todayMorningPages ? 'Read Entry' : 'Write Now'}
          </Link>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Moon size={20} className="text-primary" />
                <h2 className="text-lg font-semibold">Daily Reflection</h2>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Flame size={14} className="text-primary" />
                <span className="tabular-nums">{status?.daily_reflection_streak || 0} day streak</span>
              </div>
            </div>
            {todayReflection ? (
              <Check size={24} className="text-primary" />
            ) : (
              <Circle size={24} className="text-muted-foreground" />
            )}
          </div>
          <Link
            href="/journal/reflection"
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-150 font-medium text-sm"
          >
            {todayReflection ? 'Read Entry' : 'Write Now'}
          </Link>
        </div>
      </div>

      {/* This Week */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">This Week</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Entries written this week</p>
              <p className="text-sm text-muted-foreground tabular-nums">{status?.entries_this_week || 0} entries</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="font-medium text-sm">Sunday Review</p>
              <p className="text-sm text-muted-foreground">
                {status?.weekly_review_completed ? 'Completed' : 'Not done yet'}
              </p>
            </div>
            <Link
              href="/journal/weekly-review"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-150 font-medium text-sm"
            >
              {status?.weekly_review_completed ? 'View Review' : 'Start Review'}
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Entries</h2>
          <Link
            href="/journal/timeline"
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            View All →
          </Link>
        </div>
        {recentEntries.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No entries yet. Start writing!</p>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry: JournalEntry) => {
              const display = getEntryTypeDisplay(entry.entry_type);
              const Icon = display.icon;
              return (
                <Link
                  key={entry.id}
                  href={`/journal/entry/${entry.id}`}
                  className="block p-3 rounded-lg hover:bg-secondary/50 transition-all duration-150"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-md ${display.color}`}>
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
