'use client';

import { useState, useRef, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Inbox, Check, Trash2, X, RotateCcw } from 'lucide-react';
import { capturesApi, type Capture } from '@/lib/api/captures';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

type Tab = 'inbox' | 'archived';

export function InboxDropdown() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('inbox');
  const ref = useRef<HTMLDivElement>(null);

  const { data: countData } = useSWR('/api/v1/captures/count', () => capturesApi.getCount(), {
    refreshInterval: 30000,
  });

  const { data, isLoading } = useSWR(
    open ? `/api/v1/captures?tab=${tab}` : null,
    () => capturesApi.list(tab === 'archived'),
    { keepPreviousData: true }
  );

  const { mutate } = useSWRConfig();
  const count = countData?.count ?? 0;
  const allCaptures = data?.captures || [];
  const captures = tab === 'archived'
    ? allCaptures.filter((c) => c.processed)
    : allCaptures.filter((c) => !c.processed);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const mutateAll = () => {
    mutate('/api/v1/captures?tab=inbox');
    mutate('/api/v1/captures?tab=archived');
    mutate('/api/v1/captures/count');
  };

  const handleMarkDone = async (id: string) => {
    try {
      await capturesApi.update(id, { processed: true });
      mutateAll();
    } catch (error) {
      console.error('Failed to mark as done:', error);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await capturesApi.update(id, { processed: false });
      mutateAll();
    } catch (error) {
      console.error('Failed to restore:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await capturesApi.delete(id);
      mutateAll();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
      >
        <Inbox size={20} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile: full-screen overlay */}
          <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-lg font-semibold">Inbox</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <TabBar tab={tab} onTabChange={setTab} count={count} />
            <div className="flex-1 overflow-y-auto">
              <InboxContent
                captures={captures}
                isLoading={isLoading}
                tab={tab}
                onMarkDone={handleMarkDone}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            </div>
          </div>

          {/* Desktop: dropdown panel */}
          <div className="hidden md:block absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
            <div className="px-4 pt-3 pb-0 border-b border-border">
              <TabBar tab={tab} onTabChange={setTab} count={count} />
            </div>
            <div className="overflow-y-auto max-h-[420px]">
              <InboxContent
                captures={captures}
                isLoading={isLoading}
                tab={tab}
                onMarkDone={handleMarkDone}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TabBar({
  tab,
  onTabChange,
  count,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  count: number;
}) {
  return (
    <div className="flex gap-4 px-4 md:px-0">
      <button
        onClick={() => onTabChange('inbox')}
        className={cn(
          'pb-2 text-sm font-medium border-b-2 transition-colors',
          tab === 'inbox'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
      >
        Pending{count > 0 && ` (${count})`}
      </button>
      <button
        onClick={() => onTabChange('archived')}
        className={cn(
          'pb-2 text-sm font-medium border-b-2 transition-colors',
          tab === 'archived'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
      >
        Archived
      </button>
    </div>
  );
}

function InboxContent({
  captures,
  isLoading,
  tab,
  onMarkDone,
  onRestore,
  onDelete,
}: {
  captures: Capture[];
  isLoading: boolean;
  tab: Tab;
  onMarkDone: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (captures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Inbox size={32} className="text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-muted-foreground">
          {tab === 'inbox' ? 'Inbox clear' : 'No archived items'}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {captures.map((capture) => (
        <div key={capture.id} className="px-4 py-3 hover:bg-secondary/30 transition-colors">
          <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3 mb-2">
            {capture.text}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{formatDate(capture.created_at)}</span>
            <div className="flex items-center gap-1">
              {tab === 'inbox' ? (
                <button
                  onClick={() => onMarkDone(capture.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors"
                  title="Archive"
                >
                  <Check size={14} />
                </button>
              ) : (
                <button
                  onClick={() => onRestore(capture.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors"
                  title="Restore to inbox"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <button
                onClick={() => onDelete(capture.id)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
