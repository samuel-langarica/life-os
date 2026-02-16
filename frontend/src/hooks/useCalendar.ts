import { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { calendarApi, CalendarEvent } from '@/lib/api/calendar';
import { getMondayOfWeek, toDateString } from '@/lib/utils/date';

export function useCalendar() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMondayOfWeek());

  const weekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + 6);
    return end;
  }, [currentWeekStart]);

  const startDate = toDateString(currentWeekStart);
  const endDate = toDateString(weekEnd);

  const { data, error, isLoading } = useSWR(
    `/calendar/${startDate}/${endDate}`,
    () => calendarApi.list(startDate, endDate),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const goToPrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const goToToday = () => {
    setCurrentWeekStart(getMondayOfWeek());
  };

  const refreshEvents = () => {
    mutate(`/calendar/${startDate}/${endDate}`);
  };

  // Group events by date for easy lookup
  const eventsByDate = useMemo(() => {
    const events = data?.events || [];
    const grouped: Record<string, CalendarEvent[]> = {};

    events.forEach((event) => {
      if (!grouped[event.event_date]) {
        grouped[event.event_date] = [];
      }
      grouped[event.event_date].push(event);
    });

    // Sort events within each day by start time
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return grouped;
  }, [data?.events]);

  return {
    events: data?.events || [],
    eventsByDate,
    isLoading,
    error,
    currentWeekStart,
    weekEnd,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
    refreshEvents,
  };
}
