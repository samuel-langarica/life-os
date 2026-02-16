'use client';

import { WeeklyDashboard } from '@/components/dashboard/WeeklyDashboard';
import { InboxWidget } from '@/components/dashboard/InboxWidget';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your weekly overview and pending actions</p>
      </div>
      <WeeklyDashboard />
    </div>
  );
}
