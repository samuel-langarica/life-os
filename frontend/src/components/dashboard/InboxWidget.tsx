'use client';

import useSWR from 'swr';
import { Inbox } from 'lucide-react';
import { capturesApi } from '@/lib/api/captures';

export function InboxWidget() {
  const { data, error, isLoading } = useSWR(
    '/api/v1/captures/count',
    () => capturesApi.getCount()
  );

  const count = data?.count ?? 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover-lift transition-all duration-200 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-lg">
            <Inbox size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Inbox</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-sm text-destructive">Failed to load inbox count</div>
      ) : (
        <div>
          <div className="text-3xl font-semibold tabular-nums">{count}</div>
          <p className="text-sm text-muted-foreground">
            {count === 0 ? 'Inbox clear' : count === 1 ? 'item to process' : 'items to process'}
          </p>
        </div>
      )}
    </div>
  );
}
