'use client';

import { WeeklyDashboard } from '@/components/dashboard/WeeklyDashboard';
import { InboxWidget } from '@/components/dashboard/InboxWidget';

export default function DashboardPage() {
  // Get current week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const weekLabel = `${startOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Week of {weekLabel}</p>
      </header>
      <WeeklyDashboard />
    </div>
  );
}
