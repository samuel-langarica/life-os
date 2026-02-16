'use client';

import Link from 'next/link';
import { useCalendar } from '@/hooks/useCalendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  const weekRange = `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📅</span>
          <div className="flex-1">
            <CardTitle>This Week</CardTitle>
            <CardDescription>{weekRange}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm">Loading events...</div>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No events this week</p>
            <Link href="/calendar">
              <Button variant="outline" size="sm">
                Add Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => {
              const eventDate = new Date(event.event_date);
              const isEventToday = event.event_date === todayStr;

              return (
                <div
                  key={event.id}
                  className={`p-3 rounded-md border ${
                    isEventToday
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-center min-w-[48px]">
                      <div className="text-xs font-medium text-muted-foreground uppercase">
                        {getDayName(eventDate)}
                      </div>
                      <div className={`text-lg font-bold ${isEventToday ? 'text-primary' : 'text-foreground'}`}>
                        {eventDate.getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1">
                        {event.is_recurring && (
                          <span className="text-xs" title="Recurring event">
                            🔁
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">
                            {event.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {events.length > upcomingEvents.length && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                +{events.length - upcomingEvents.length} more events this week
              </div>
            )}

            <Link href="/calendar" className="block">
              <Button variant="outline" className="w-full mt-4">
                View Full Week →
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
