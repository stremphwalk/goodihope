import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

interface GroupEvent {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  createdByUserId: number;
  createdAt: string;
  createdBy: {
    name?: string;
    customIdentifier: string;
  };
}

interface WeeklyCalendarProps {
  events: GroupEvent[];
}

export function WeeklyCalendar({ events }: WeeklyCalendarProps) {
  // Get current week's dates
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const eventDate = new Date(event.eventDate);
    const dateKey = eventDate.toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, GroupEvent[]>);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No events scheduled this week</p>
        <p className="text-gray-400 text-xs mt-1">Add an event to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {weekDays.map((date, index) => {
        const dateKey = date.toISOString().split('T')[0];
        const dayEvents = eventsByDate[dateKey] || [];
        const isCurrentDay = isToday(date);
        const isPastDay = isPast(date);

        return (
          <div
            key={dateKey}
            className={`p-3 rounded-lg border transition-colors ${
              isCurrentDay 
                ? 'bg-blue-50 border-blue-200' 
                : isPastDay 
                ? 'bg-gray-50 border-gray-200 opacity-60' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  isCurrentDay ? 'text-blue-700' : isPastDay ? 'text-gray-500' : 'text-gray-700'
                }`}>
                  {dayNames[index]}
                </span>
                <span className={`text-xs ${
                  isCurrentDay ? 'text-blue-600' : isPastDay ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {date.getDate()}/{date.getMonth() + 1}
                </span>
                {isCurrentDay && (
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    Today
                  </Badge>
                )}
              </div>
              {dayEvents.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {dayEvents.length}
                </Badge>
              )}
            </div>

            {dayEvents.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No events</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div 
                    key={event.id}
                    className={`p-2 rounded border-l-2 bg-white ${
                      isPastDay ? 'border-l-gray-300' : 'border-l-blue-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isPastDay ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {event.title}
                        </p>
                        {event.description && (
                          <p className={`text-xs mt-1 line-clamp-2 ${
                            isPastDay ? 'text-gray-500' : 'text-gray-600'
                          }`}>
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatTime(event.eventDate)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            by {event.createdBy.name || event.createdBy.customIdentifier || 'Unknown User'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}