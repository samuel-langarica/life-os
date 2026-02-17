'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getCurrentWeek, formatWeekRange } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { InboxDropdown } from './InboxDropdown';

function useClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

export function TopBar() {
  const user = useAuthStore((state) => state.user);
  const { start, end } = getCurrentWeek(user?.week_start_day || 1);
  const time = useClock();

  const formattedTime = time
    ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  const weekNumber = getWeekNumber(new Date());

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {user?.display_name ? `Welcome back, ${user.display_name}` : 'Life OS'}
            </h2>
            <p className="text-sm text-muted-foreground">
              W{weekNumber} · {formatWeekRange(start, end)}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <InboxDropdown />
            <ThemeToggle />
            {formattedTime && (
              <span className="text-sm font-mono text-muted-foreground tabular-nums">
                {formattedTime}
              </span>
            )}
            {user && (
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-card rounded-lg border border-border">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{user.display_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
