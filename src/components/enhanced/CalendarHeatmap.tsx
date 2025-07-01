
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Calendar } from 'lucide-react';

interface CalendarHeatmapProps {
  dailySessions: Array<{
    session_date: string;
    ayahs_memorized: number;
    ayahs_reviewed: number;
    total_time_minutes: number;
  }>;
  currentStreak: number;
  bestStreak: number;
  className?: string;
}

const CalendarHeatmap = ({ 
  dailySessions, 
  currentStreak, 
  bestStreak, 
  className = '' 
}: CalendarHeatmapProps) => {
  // Generate last 4 weeks of dates
  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();
    
    for (let weekIndex = 3; weekIndex >= 0; weekIndex--) {
      const week = [];
      for (let dayIndex = 6; dayIndex >= 0; dayIndex--) {
        const date = new Date(today);
        date.setDate(today.getDate() - (weekIndex * 7 + dayIndex));
        week.unshift(date);
      }
      weeks.push(week);
    }
    
    return weeks;
  };

  const getActivityLevel = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const session = dailySessions.find(s => s.session_date === dateStr);
    
    if (!session) return 0;
    
    const totalActivity = (session.ayahs_memorized || 0) + (session.ayahs_reviewed || 0);
    
    if (totalActivity === 0) return 0;
    if (totalActivity <= 2) return 1;
    if (totalActivity <= 5) return 2;
    if (totalActivity <= 10) return 3;
    return 4;
  };

  const getActivityColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-slate-100 dark:bg-slate-800';
      case 1: return 'bg-emerald-200 dark:bg-emerald-900/50';
      case 2: return 'bg-emerald-400 dark:bg-emerald-700';
      case 3: return 'bg-emerald-600 dark:bg-emerald-600';
      case 4: return 'bg-emerald-800 dark:bg-emerald-500';
      default: return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  const getSessionData = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return dailySessions.find(s => s.session_date === dateStr);
  };

  const weeks = generateWeeks();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card className={`p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Activity
            </h3>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {currentStreak}
                </span>
              </div>
              <p className="text-xs text-slate-500">Current</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <Flame className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {bestStreak}
                </span>
              </div>
              <p className="text-xs text-slate-500">Best</p>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, index) => (
              <div key={index} className="text-xs text-slate-500 text-center font-medium">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar weeks */}
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((date, dayIndex) => {
                const activityLevel = getActivityLevel(date);
                const sessionData = getSessionData(date);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={dayIndex}
                    className={`
                      w-8 h-8 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110
                      ${getActivityColor(activityLevel)}
                      ${isToday ? 'ring-2 ring-emerald-600 ring-offset-1' : ''}
                    `}
                    title={`${date.toLocaleDateString()}: ${
                      sessionData 
                        ? `${sessionData.ayahs_memorized} memorized, ${sessionData.ayahs_reviewed} reviewed`
                        : 'No activity'
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Less</span>
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getActivityColor(level)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>

        {/* Summary Stats */}
        <div className="flex justify-between text-sm">
          <div className="text-center">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {dailySessions.reduce((sum, s) => sum + (s.ayahs_memorized || 0), 0)}
            </p>
            <p className="text-xs text-slate-500">Memorized</p>
          </div>
          
          <div className="text-center">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {dailySessions.reduce((sum, s) => sum + (s.ayahs_reviewed || 0), 0)}
            </p>
            <p className="text-xs text-slate-500">Reviewed</p>
          </div>
          
          <div className="text-center">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              {Math.round(dailySessions.reduce((sum, s) => sum + (s.total_time_minutes || 0), 0) / 60)}h
            </p>
            <p className="text-xs text-slate-500">Total Time</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CalendarHeatmap;
