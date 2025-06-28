import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Flame, Target, BookOpen, TrendingUp } from 'lucide-react';
import { supabaseService, type DailySession } from '@/services/SupabaseService';

interface CalendarTrackerProps {
  className?: string;
}

const CalendarTracker = ({ className }: CalendarTrackerProps) => {
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState({
    currentStreak: 0,
    bestStreak: 0,
    totalMemorized: 0,
    thisMonthDays: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load sessions for the past 90 days to calculate streaks
      const sessionsData = await supabaseService.getDailySessions(90);
      setSessions(sessionsData);
      
      // Calculate stats
      calculateStats(sessionsData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (sessionsData: DailySession[]) => {
    const today = new Date();
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const currentMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Sort sessions by date (newest first)
    const sortedSessions = sessionsData.sort((a, b) => 
      new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
    );

    // Calculate current streak
    let currentStreak = 0;
    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].session_date);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (sessionDate.toDateString() === expectedDate.toDateString()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate best streak
    let bestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < sortedSessions.length - 1; i++) {
      const currentDate = new Date(sortedSessions[i].session_date);
      const nextDate = new Date(sortedSessions[i + 1].session_date);
      const dayDiff = Math.abs(currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);

    // Calculate total memorized and this month's active days
    const totalMemorized = sessionsData.reduce((sum, session) => sum + session.ayahs_memorized, 0);
    const thisMonthSessions = sessionsData.filter(session => {
      const sessionDate = new Date(session.session_date);
      return sessionDate >= currentMonthStart && sessionDate <= currentMonthEnd;
    });

    setStats({
      currentStreak,
      bestStreak,
      totalMemorized,
      thisMonthDays: thisMonthSessions.length
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getSessionForDate = (date: Date) => {
    return sessions.find(session => 
      new Date(session.session_date).toDateString() === date.toDateString()
    );
  };

  const getDateIntensity = (session: DailySession | undefined) => {
    if (!session || session.ayahs_memorized === 0) return 'bg-slate-100 dark:bg-slate-800';
    
    const intensity = Math.min(session.ayahs_memorized, 5);
    const intensityClasses = [
      'bg-emerald-100 dark:bg-emerald-900/30',
      'bg-emerald-200 dark:bg-emerald-800/50',
      'bg-emerald-300 dark:bg-emerald-700/70',
      'bg-emerald-400 dark:bg-emerald-600/80',
      'bg-emerald-500 dark:bg-emerald-500'
    ];
    
    return intensityClasses[intensity - 1] || intensityClasses[4];
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

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const session = getSessionForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isFuture = date > new Date();

      days.push(
        <div
          key={day}
          className={`
            h-8 w-8 rounded-sm flex items-center justify-center text-xs font-medium
            ${getDateIntensity(session)}
            ${isToday ? 'ring-2 ring-emerald-600 ring-offset-1' : ''}
            ${isFuture ? 'opacity-30' : ''}
            transition-all duration-200 hover:scale-110
          `}
          title={
            session 
              ? `${session.ayahs_memorized} ayah${session.ayahs_memorized === 1 ? '' : 's'} memorized`
              : isFuture 
                ? 'Future date'
                : 'No activity'
          }
        >
          {day}
        </div>
      );
    }

    return days;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {stats.currentStreak}
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Day Streak
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {stats.totalMemorized}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Total Ayahs
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats.bestStreak}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Best Streak
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {stats.thisMonthDays}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Active Days
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            
            <div className="flex space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                disabled={currentMonth.getMonth() >= new Date().getMonth() && currentMonth.getFullYear() >= new Date().getFullYear()}
              >
                →
              </button>
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
            {renderCalendar()}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 bg-slate-100 dark:bg-slate-800 rounded-sm"></div>
              <span>No activity</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 bg-emerald-200 dark:bg-emerald-800/50 rounded-sm"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 bg-emerald-400 dark:bg-emerald-600/80 rounded-sm"></div>
              <span>High</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CalendarTracker;