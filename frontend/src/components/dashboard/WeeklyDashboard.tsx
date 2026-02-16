'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InboxWidget } from '@/components/dashboard/InboxWidget';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { JournalWidget } from '@/components/dashboard/JournalWidget';
import { ProjectsWidget } from '@/components/dashboard/ProjectsWidget';

export function WeeklyDashboard() {
  return (
    <div className="space-y-6">
      {/* Pending Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Actions</CardTitle>
          <CardDescription>Tasks and items that need your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No pending actions</p>
            <p className="text-sm mt-2">Coming soon...</p>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Widget */}
      <CalendarWidget />

      {/* Workout Week */}
      <Card>
        <CardHeader>
          <CardTitle>Workout This Week</CardTitle>
          <CardDescription>Your fitness progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No workouts planned</p>
            <p className="text-sm mt-2">Coming soon...</p>
          </div>
        </CardContent>
      </Card>

      {/* Journal Status */}
      <JournalWidget />

      {/* Project Objectives */}
      <ProjectsWidget />

      {/* Inbox */}
      <InboxWidget />
    </div>
  );
}
