'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { capturesApi } from '@/lib/api/captures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function InboxWidget() {
  const { data, error, isLoading } = useSWR(
    '/api/v1/captures/count',
    () => capturesApi.getCount()
  );

  const count = data?.count ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbox</CardTitle>
        <CardDescription>Captured ideas and quick notes</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>Failed to load inbox count</p>
          </div>
        ) : count === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📥</div>
            <p className="text-muted-foreground">Inbox Zero!</p>
            <p className="text-sm text-muted-foreground mt-1">All captures processed</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl font-bold text-blue-600 mb-2">{count}</div>
            <p className="text-muted-foreground mb-4">
              {count === 1 ? 'capture' : 'captures'} to process
            </p>
            <Link href="/captures">
              <Button>Process Now</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
