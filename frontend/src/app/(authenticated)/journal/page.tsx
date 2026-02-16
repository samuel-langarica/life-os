'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function JournalPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Journal</h1>
        <p className="text-muted-foreground mt-1">Morning pages, reflections, and weekly reviews</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Status</CardTitle>
            <CardDescription>Complete your daily entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>Journal module coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
