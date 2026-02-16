'use client';

import Link from 'next/link';
import { Calendar, Repeat } from 'lucide-react';
import { useCalendar } from '@/hooks/useCalendar';
import { formatDate, formatTime, getDayName, toDateString } from '@/lib/utils/date';

export function CalendarWidget() {
  const { events, isLoading, currentWeekStart, weekEnd } = useCalendar();

  // Get upcoming events from today onwards, limit to 5
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateString(today);

  const upcomingEvents = events
    .filter((event) => event.event_date >= todayStr)
    .sort((a, b) => {
      const dateCompare = a.event_date.localeCompare(b.event_date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    })
    .slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200 animate-slide-up" style={{ animationDelay: '50ms' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-lg">
            <Calendar size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">This Week</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">No events scheduled</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {upcomingEvents.map((event) => {
            const eventDate = new Date(event.event_date);
            const isEventToday = event.event_date === todayStr;

            return (
              <div key={event.id} className="flex items-start gap-3">
                <div className="text-xs font-mono text-muted-foreground pt-0.5 w-12">
                  {formatTime(event.start_time)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    {event.is_recurring && (
                      <Repeat size={12} className="text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium">{event.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getDayName(eventDate)}, {formatDate(event.event_date)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/calendar"
        className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        View week →
      </Link>
    </div>
  );
}
