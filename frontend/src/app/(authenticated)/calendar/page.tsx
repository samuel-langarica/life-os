'use client';

import { useState } from 'react';
import { Repeat, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendar } from '@/hooks/useCalendar';
import { EventModal } from '@/components/calendar/EventModal';
import { CalendarEvent } from '@/lib/api/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  formatDateRange,
  formatDayHeader,
  getWeekDays,
  toDateString,
  isToday,
  formatTime,
} from '@/lib/utils/date';

export default function CalendarPage() {
  const {
    eventsByDate,
    isLoading,
    currentWeekStart,
    weekEnd,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
    refreshEvents,
  } = useCalendar();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [selectedDate, setSelectedDate] = useState<string | undefined>();

  const weekDays = getWeekDays(currentWeekStart);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setIsModalOpen(true);
  };

  const handleAddEvent = (date?: string) => {
    setSelectedEvent(undefined);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(undefined);
    setSelectedDate(undefined);
  };

  const handleSuccess = () => {
    refreshEvents();
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Calendar</h1>
        <p className="text-muted-foreground">Weekly schedule and events</p>
      </header>

      <div className="space-y-6">
        {/* Week navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={goToPrevWeek} disabled={isLoading}>
                  <ChevronLeft size={16} />
                  <span className="ml-1">Prev</span>
                </Button>
                <h2 className="text-lg font-semibold text-foreground">
                  Week of {formatDateRange(currentWeekStart, weekEnd)}
                </h2>
                <Button variant="outline" size="sm" onClick={goToNextWeek} disabled={isLoading}>
                  <span className="mr-1">Next</span>
                  <ChevronRight size={16} />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday} disabled={isLoading}>
                  Today
                </Button>
                <Button size="sm" onClick={() => handleAddEvent()}>
                  <Plus size={16} className="mr-1" />
                  Add Event
                </Button>
              </div>
            </div>

            {/* Week grid - Desktop */}
            <div className="hidden md:block">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dateStr = toDateString(day);
                  const dayHeader = formatDayHeader(day);
                  const dayEvents = eventsByDate[dateStr] || [];
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[200px] border rounded-lg p-3 ${
                        isTodayDate ? 'bg-blue-50 border-blue-200' : 'bg-card border-border'
                      }`}
                    >
                      {/* Day header */}
                      <div className="text-center mb-3 pb-2 border-b border-border">
                        <div className="text-xs font-medium text-muted-foreground">{dayHeader.day}</div>
                        <div
                          className={`text-lg font-semibold ${
                            isTodayDate ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {dayHeader.date}
                        </div>
                      </div>

                      {/* Events */}
                      <div className="space-y-2">
                        {isLoading ? (
                          <div className="text-xs text-muted-foreground text-center py-2">Loading...</div>
                        ) : dayEvents.length === 0 ? (
                          <button
                            onClick={() => handleAddEvent(dateStr)}
                            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                          >
                            + Add event
                          </button>
                        ) : (
                          dayEvents.map((event) => (
                            <button
                              key={event.id}
                              onClick={() => handleEventClick(event)}
                              className="w-full text-left p-2 rounded-md bg-blue-100 hover:bg-blue-200 transition-colors border border-blue-200"
                            >
                              <div className="flex items-start gap-1">
                                {event.is_recurring && (
                                  <span title="Recurring event">
                                    <Repeat size={12} className="text-muted-foreground" />
                                  </span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-foreground truncate">
                                    {event.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatTime(event.start_time)}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Week list - Mobile */}
            <div className="md:hidden space-y-4">
              {weekDays.map((day) => {
                const dateStr = toDateString(day);
                const dayHeader = formatDayHeader(day);
                const dayEvents = eventsByDate[dateStr] || [];
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={dateStr}
                    className={`border rounded-lg p-4 ${
                      isTodayDate ? 'bg-blue-50 border-blue-200' : 'bg-card border-border'
                    }`}
                  >
                    {/* Day header */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">{dayHeader.day}</div>
                        <div className={`text-xl font-semibold ${isTodayDate ? 'text-primary' : 'text-foreground'}`}>
                          {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddEvent(dateStr)}
                      >
                        + Add
                      </Button>
                    </div>

                    {/* Events */}
                    <div className="space-y-2">
                      {isLoading ? (
                        <div className="text-sm text-muted-foreground text-center py-4">Loading...</div>
                      ) : dayEvents.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">No events</div>
                      ) : (
                        dayEvents.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className="w-full text-left p-3 rounded-md bg-blue-100 hover:bg-blue-200 transition-colors border border-blue-200"
                          >
                            <div className="flex items-start gap-2">
                              {event.is_recurring && (
                                <span className="text-sm" title="Recurring event">
                                  🔁
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground">{event.title}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                </div>
                                {event.description && (
                                  <div className="text-xs text-muted-foreground mt-1 truncate">
                                    {event.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        initialDate={selectedDate}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
