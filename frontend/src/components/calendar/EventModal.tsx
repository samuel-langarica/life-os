'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent, calendarApi } from '@/lib/api/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toDateString } from '@/lib/utils/date';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  initialDate?: string;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

type UpdateScope = 'single' | 'future' | 'all';
type DeleteScope = 'single' | 'future' | 'all';

export function EventModal({ isOpen, onClose, event, initialDate, onSuccess }: EventModalProps) {
  const isEditing = !!event;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Edit scope for recurring events
  const [updateScope, setUpdateScope] = useState<UpdateScope>('single');
  const [deleteScope, setDeleteScope] = useState<DeleteScope>('single');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with event data or defaults
  useEffect(() => {
    if (isOpen) {
      if (event) {
        setTitle(event.title);
        setDescription(event.description || '');
        setEventDate(event.event_date);
        setStartTime(event.start_time);
        setEndTime(event.end_time);
        setIsRecurring(event.is_recurring);
        setRecurrenceEndDate(event.recurrence_end_date || '');

        // Parse recurrence pattern to get days
        if (event.recurrence_pattern) {
          try {
            const pattern = JSON.parse(event.recurrence_pattern);
            setRecurrenceDays(pattern.days_of_week || []);
          } catch (e) {
            setRecurrenceDays([]);
          }
        }
      } else {
        // New event defaults
        setTitle('');
        setDescription('');
        setEventDate(initialDate || toDateString(new Date()));
        setStartTime('09:00');
        setEndTime('10:00');
        setIsRecurring(false);
        setRecurrenceDays([]);
        setRecurrenceEndDate('');
      }
      setErrors({});
      setUpdateScope('single');
      setDeleteScope('single');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, event, initialDate]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showDeleteConfirm) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, showDeleteConfirm]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const toggleRecurrenceDay = (dayId: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 255) {
      newErrors.title = 'Title must be 255 characters or less';
    }

    if (!eventDate) {
      newErrors.eventDate = 'Date is required';
    }

    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (isRecurring) {
      if (recurrenceDays.length === 0) {
        newErrors.recurrenceDays = 'Select at least one day';
      }

      if (!recurrenceEndDate) {
        newErrors.recurrenceEndDate = 'End date is required for recurring events';
      } else if (recurrenceEndDate <= eventDate) {
        newErrors.recurrenceEndDate = 'End date must be after event date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const eventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? 'weekly' : undefined,
        recurrence_end_date: isRecurring ? recurrenceEndDate : undefined,
        recurrence_days: isRecurring ? recurrenceDays : undefined,
      };

      if (isEditing && event) {
        await calendarApi.update(event.id, eventData, updateScope);
      } else {
        await calendarApi.create(eventData);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await calendarApi.delete(event.id, deleteScope);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4 z-10 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                {isEditing ? 'Edit Event' : 'New Event'}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Team Standup"
                error={errors.title}
                disabled={isSubmitting}
                maxLength={255}
                required
              />

              {/* Description */}
              <Textarea
                label="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Daily team sync"
                disabled={isSubmitting}
                rows={3}
              />

              {/* Date */}
              <Input
                label="Date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                error={errors.eventDate}
                disabled={isSubmitting}
                required
              />

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  error={errors.startTime}
                  disabled={isSubmitting}
                  required
                />
                <Input
                  label="End Time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  error={errors.endTime}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Recurring checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-foreground cursor-pointer">
                  Repeat this event
                </label>
              </div>

              {/* Recurring options */}
              {isRecurring && (
                <div className="space-y-4 pl-6 border-l-2 border-muted">
                  {/* Days of week */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Repeat on</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleRecurrenceDay(day.id)}
                          disabled={isSubmitting}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            recurrenceDays.includes(day.id)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    {errors.recurrenceDays && (
                      <p className="text-sm text-destructive mt-1">{errors.recurrenceDays}</p>
                    )}
                  </div>

                  {/* End date */}
                  <Input
                    label="Repeat until"
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    error={errors.recurrenceEndDate}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Update scope for recurring events */}
              {isEditing && event?.is_recurring && (
                <div className="space-y-2 p-4 bg-muted/50 rounded-md">
                  <label className="block text-sm font-medium text-foreground">Edit scope</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="updateScope"
                        value="single"
                        checked={updateScope === 'single'}
                        onChange={(e) => setUpdateScope(e.target.value as UpdateScope)}
                        disabled={isSubmitting}
                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                      <span className="text-sm text-foreground">This event only</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="updateScope"
                        value="future"
                        checked={updateScope === 'future'}
                        onChange={(e) => setUpdateScope(e.target.value as UpdateScope)}
                        disabled={isSubmitting}
                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                      <span className="text-sm text-foreground">This and future events</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="updateScope"
                        value="all"
                        checked={updateScope === 'all'}
                        onChange={(e) => setUpdateScope(e.target.value as UpdateScope)}
                        disabled={isSubmitting}
                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                      <span className="text-sm text-foreground">All events in series</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-muted/50 rounded-b-lg">
            <div>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                >
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && event?.is_recurring && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6 z-10">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Delete recurring event?</h3>
            <div className="space-y-2 mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteScope"
                  value="single"
                  checked={deleteScope === 'single'}
                  onChange={(e) => setDeleteScope(e.target.value as DeleteScope)}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <span className="text-sm text-foreground">This event only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteScope"
                  value="future"
                  checked={deleteScope === 'future'}
                  onChange={(e) => setDeleteScope(e.target.value as DeleteScope)}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <span className="text-sm text-foreground">This and future events</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteScope"
                  value="all"
                  checked={deleteScope === 'all'}
                  onChange={(e) => setDeleteScope(e.target.value as DeleteScope)}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <span className="text-sm text-foreground">All events in series</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Simple delete for non-recurring events */}
      {showDeleteConfirm && event && !event.is_recurring && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6 z-10">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Delete event?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete "{event.title}"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
