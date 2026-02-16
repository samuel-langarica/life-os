'use client';

import { InboxWidget } from '@/components/dashboard/InboxWidget';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { JournalWidget } from '@/components/dashboard/JournalWidget';
import { ProjectsWidget } from '@/components/dashboard/ProjectsWidget';
import { FitnessWidget } from '@/components/dashboard/FitnessWidget';

export function WeeklyDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <InboxWidget />
      <CalendarWidget />
      <JournalWidget />
      <ProjectsWidget />
      <FitnessWidget />
    </div>
  );
}
