import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, BookOpen, Star, CheckCircle } from 'lucide-react';
import { supabaseService, type DailySession } from '@/services/SupabaseService';
import { useMemorizedAyahs } from '@/hooks/useSupabaseData';

interface CalendarDay {
  date: Date;
  ayahsMemorized: number;
  ayahsReviewed: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  memorizedAyahs: Array<{ surah: number; ayah: number }>;
}

interface InteractiveCalendarProps {
  onDateSelect?: (date: Date, dayData: CalendarDay) => void;
  className?: string;
}

const InteractiveCalendar = ({ onDateSelect, className }: InteractiveCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { memorizedAyahs } = useMemorizedAyahs();

  useEffect(() => {
    loadCalendarData();
  }, [currentMonth, memorizedAyahs]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      // Load sessions for the current month + buffer
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const sessionsData = await supabaseService.getDailySessions(daysDiff);
      setSessions(sessionsData);
      
      generateCalendarDays(sessionsData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCalendarDays = (sessionsData: DailySession[]) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and how many days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push(createCalendarDay(date, false, today, sessionsData));
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(createCalendarDay(date, true, today, sessionsData));
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push(createCalendarDay(date, false, today, sessionsData));
    }

    setCalendarDays(days);
  };

  const createCalendarDay = (
    date: Date, 
    isCurrentMonth: boolean, 
    today: Date, 
    sessionsData: DailySession[]
  ): CalendarDay => {
    const dateStr = date.toISOString().split('T')[0];
    const session = sessionsData.find(s => s.session_date === dateStr);
    
    // Get memorized ayahs for this date
    const dayMemorizedAyahs = memorizedAyahs.filter(ayah => {
      const memorizedDate = new Date(ayah.memorized_at).toISOString().split('T')[0];
      return memorizedDate === dateStr;
    }).map(ayah => ({
      surah: ayah.surah_number,
      ayah: ayah.ayah_number
    }));

    return {
      date,
      ayahsMemorized: session?.ayahs_memorized || dayMemorizedAyahs.length,
      ayahsReviewed: session?.ayahs_reviewed || 0,
      isToday: date.getTime() === today.getTime(),
      isCurrentMonth,
      memorizedAyahs: dayMemorizedAyahs
    };
  };

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    if (onDateSelect) {
      onDateSelect(day.date, day);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDayIntensity = (day: CalendarDay): string => {
    if (!day.isCurrentMonth) return 'opacity-30';
    
    const total = day.ayahsMemorized + day.ayahsReviewed;
    
    if (total === 0) {
      return day.isToday 
        ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500' 
        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700';
    }
    
    // Color intensity based on activity
    if (total >= 5) return 'bg-emerald-500 text-white';
    if (total >= 3) return 'bg-emerald-400 text-white';
    if (total >= 2) return 'bg-emerald-300 text-emerald-900';
    return 'bg-emerald-200 text-emerald-800';
  };

  const getStreakInfo = (): { current: number; best: number } => {
    const sortedDays = calendarDays
      .filter(day => day.isCurrentMonth && day.ayahsMemorized > 0)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak from today backwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < calendarDays.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      
      const dayData = calendarDays.find(day => 
        day.date.getTime() === checkDate.getTime() && day.ayahsMemorized > 0
      );
      
      if (dayData) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate best streak
    sortedDays.forEach((day, index) => {
      if (index === 0 || sortedDays[index - 1].date.getTime() - day.date.getTime() === 86400000) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    });
    bestStreak = Math.max(bestStreak, tempStreak);

    return { current: currentStreak, best: bestStreak };
  };

  const streakInfo = getStreakInfo();

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={currentMonth.getMonth() >= new Date().getMonth() && currentMonth.getFullYear() >= new Date().getFullYear()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Streak Info */}
        <div className="flex justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
            <span className="text-orange-600">🔥</span>
            <span className="text-orange-700 dark:text-orange-300 font-medium">
              {streakInfo.current} day streak
            </span>
          </div>
          <div className="flex items-center space-x-1 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
            <span className="text-purple-600">🏆</span>
            <span className="text-purple-700 dark:text-purple-300 font-medium">
              Best: {streakInfo.best}
            </span>
          </div>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                h-12 w-full rounded-lg flex flex-col items-center justify-center text-xs font-medium
                transition-all duration-200 hover:scale-105 hover:shadow-md
                ${getDayIntensity(day)}
                ${selectedDate?.getTime() === day.date.getTime() ? 'ring-2 ring-emerald-500 ring-offset-1' : ''}
              `}
              disabled={day.date > new Date()}
            >
              <span className="text-xs">{day.date.getDate()}</span>
              {(day.ayahsMemorized > 0 || day.ayahsReviewed > 0) && (
                <div className="flex space-x-1 mt-1">
                  {day.ayahsMemorized > 0 && (
                    <div className="w-1 h-1 bg-current rounded-full opacity-80"></div>
                  )}
                  {day.ayahsReviewed > 0 && (
                    <div className="w-1 h-1 bg-current rounded-full opacity-60"></div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="text-center space-y-2">
              <h4 className="font-medium text-slate-800 dark:text-slate-200">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              
              {(() => {
                const dayData = calendarDays.find(d => d.date.getTime() === selectedDate.getTime());
                if (!dayData || (dayData.ayahsMemorized === 0 && dayData.ayahsReviewed === 0)) {
                  return (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No activity on this day
                    </p>
                  );
                }
                
                return (
                  <div className="space-y-2">
                    <div className="flex justify-center space-x-4 text-sm">
                      {dayData.ayahsMemorized > 0 && (
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-700 dark:text-emerald-300">
                            {dayData.ayahsMemorized} memorized
                          </span>
                        </div>
                      )}
                      {dayData.ayahsReviewed > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-700 dark:text-yellow-300">
                            {dayData.ayahsReviewed} reviewed
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {dayData.memorizedAyahs.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400">Memorized Ayahs:</p>
                        <div className="flex flex-wrap justify-center gap-1">
                          {dayData.memorizedAyahs.map((ayah, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {ayah.surah}:{ayah.ayah}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 bg-slate-100 dark:bg-slate-800 rounded"></div>
            <span>No activity</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 bg-emerald-200 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 bg-emerald-400 rounded"></div>
            <span>High</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default InteractiveCalendar;