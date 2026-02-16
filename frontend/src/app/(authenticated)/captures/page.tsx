'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { capturesApi, type Capture } from '@/lib/api/captures';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useSWRConfig } from 'swr';

export default function CapturesPage() {
  const { data, error, isLoading } = useSWR(
    '/api/v1/captures',
    () => capturesApi.list(false)
  );
  const { mutate } = useSWRConfig();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [markingDoneIds, setMarkingDoneIds] = useState<Set<string>>(new Set());

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Simple feedback - could enhance with a toast notification
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const handleMarkDone = async (id: string) => {
    setMarkingDoneIds(prev => new Set(prev).add(id));

    try {
      await capturesApi.update(id, { processed: true });

      // Mutate cache to refresh data
      mutate('/api/v1/captures');
      mutate('/api/v1/captures/count');
    } catch (error) {
      console.error('Failed to mark as done:', error);
      alert('Failed to mark as done. Please try again.');
    } finally {
      setMarkingDoneIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this capture?')) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(id));

    try {
      await capturesApi.delete(id);

      // Mutate cache to refresh data
      mutate('/api/v1/captures');
      mutate('/api/v1/captures/count');
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete capture. Please try again.');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
          <p className="text-muted-foreground mt-1">Loading captures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
          <p className="text-red-600 mt-1">Failed to load captures. Please try again.</p>
        </div>
      </div>
    );
  }

  const captures = data?.captures || [];
  const count = captures.length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
        <p className="text-muted-foreground mt-1">
          {count === 0 ? 'All captures processed' : `${count} ${count === 1 ? 'capture' : 'captures'} to process`}
        </p>
      </div>

      {captures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">📥</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Inbox Zero!</h2>
          <p className="text-muted-foreground">All captures processed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {captures.map((capture) => (
            <CaptureCard
              key={capture.id}
              capture={capture}
              onCopy={handleCopy}
              onMarkDone={handleMarkDone}
              onDelete={handleDelete}
              isDeleting={deletingIds.has(capture.id)}
              isMarkingDone={markingDoneIds.has(capture.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CaptureCardProps {
  capture: Capture;
  onCopy: (text: string) => void;
  onMarkDone: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  isMarkingDone: boolean;
}

function CaptureCard({
  capture,
  onCopy,
  onMarkDone,
  onDelete,
  isDeleting,
  isMarkingDone,
}: CaptureCardProps) {
  const getSourceBadge = (source: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      manual: { label: 'Manual', color: 'bg-gray-100 text-gray-800' },
      siri: { label: 'Siri', color: 'bg-purple-100 text-purple-800' },
      external: { label: 'External', color: 'bg-blue-100 text-blue-800' },
    };

    const badge = badges[source] || badges.manual;

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const isDisabled = isDeleting || isMarkingDone;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <p className="text-gray-900 mb-3 whitespace-pre-wrap">{capture.text}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{formatDate(capture.created_at)}</span>
          <span>•</span>
          {getSourceBadge(capture.source)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onCopy(capture.text)}
            disabled={isDisabled}
            className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            Copy
          </button>
          <button
            onClick={() => onMarkDone(capture.id)}
            disabled={isDisabled}
            className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isMarkingDone ? 'Processing...' : 'Done'}
          </button>
          <button
            onClick={() => onDelete(capture.id)}
            disabled={isDisabled}
            className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
