import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Target, 
  Calendar, 
  TrendingUp, 
  Award, 
  Clock,
  CheckCircle,
  Star
} from 'lucide-react';
import { supabaseService } from '@/services/SupabaseService';
import { useUserProgressData } from '@/hooks/useSupabaseData';
import { notificationService } from '@/services/NotificationService';

interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  totalMemorized: number;
  weeklyGoal: number;
  weeklyProgress: number;
  monthlyGoal: number;
  monthlyProgress: number;
  averagePerDay: number;
  daysActive: number;
}

interface HabitTrackerProps {
  onNavigate?: (page: string) => void;
  className?: string;
}

const HabitTracker = ({ onNavigate, className }: HabitTrackerProps) => {
  const [stats, setStats] = useState<HabitStats>({
    currentStreak: 0,
    bestStreak: 0,
    totalMemorized: 0,
    weeklyGoal: 7,
    weeklyProgress: 0,
    monthlyGoal: 30,
    monthlyProgress: 0,
    averagePerDay: 0,
    daysActive: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  
  const { progress } = useUserProgressData();

  useEffect(() => {
    loadHabitStats();
    setMotivationalMessage(getMotivationalMessage());
  }, [progress]);

  const loadHabitStats = async () => {
    setIsLoading(true);
    try {
      const progressStats = await supabaseService.getProgressStats();
      const sessions = await supabaseService.getDailySessions(30);
      
      // Calculate weekly progress (last 7 days)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      const weekSessions = sessions.filter(session => 
        new Date(session.session_date) >= weekStart
      );
      const weeklyProgress = weekSessions.reduce((sum, session) => 
        sum + session.ayahs_memorized, 0
      );

      // Calculate monthly progress
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthSessions = sessions.filter(session => 
        new Date(session.session_date) >= monthStart
      );
      const monthlyProgress = monthSessions.reduce((sum, session) => 
        sum + session.ayahs_memorized, 0
      );

      // Calculate average per day
      const activeDays = sessions.filter(session => session.ayahs_memorized > 0).length;
      const totalAyahs = sessions.reduce((sum, session) => sum + session.ayahs_memorized, 0);
      const averagePerDay = activeDays > 0 ? totalAyahs / activeDays : 0;

      setStats({
        currentStreak: progressStats.currentStreak,
        bestStreak: progressStats.bestStreak,
        totalMemorized: progressStats.totalMemorized,
        weeklyGoal: 7, // 1 ayah per day
        weeklyProgress,
        monthlyGoal: 30, // 1 ayah per day
        monthlyProgress,
        averagePerDay: Math.round(averagePerDay * 10) / 10,
        daysActive: activeDays
      });
    } catch (error) {
      console.error('Error loading habit stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMotivationalMessage = (): string => {
    const messages = [
      "Every ayah brings you closer to Allah 🤲",
      "Consistency is the key to memorization 🔑",
      "Your dedication is inspiring! Keep going 💪",
      "Small steps lead to great achievements 🌟",
      "The Quran is a light in your heart ✨",
      "Your memory palace is growing stronger 🏰",
      "Each day is a new opportunity to learn 📚",
      "Your spiritual journey is beautiful 🌙"
    ];
    
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Start your day with the Quran ☀️";
    } else if (hour < 18) {
      return "Perfect time for your daily ayah 🌤️";
    } else {
      return "End your day with divine words 🌙";
    }
  };

  const getStreakEmoji = (streak: number): string => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 14) return '🔥🔥';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⭐';
    return '🌱';
  };

  const getProgressColor = (progress: number, goal: number): string => {
    const percentage = (progress / goal) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const setupNotifications = async () => {
    const settings = notificationService.loadSettings();
    const success = await notificationService.scheduleDaily(settings);
    
    if (success) {
      alert('Daily reminders set up successfully! 🔔');
    } else {
      alert('Please enable notifications in your browser settings.');
    }
  };

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
    <div className={`space-y-6 ${className}`}>
      {/* Motivational Header */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
            Your Quran Journey
          </h2>
          <p className="text-emerald-700 dark:text-emerald-400">
            {motivationalMessage}
          </p>
        </div>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current Streak */}
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Flame className="h-6 w-6 text-orange-600" />
              <span className="text-2xl">{getStreakEmoji(stats.currentStreak)}</span>
            </div>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
              {stats.currentStreak}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">
              Day Streak
            </div>
            {stats.currentStreak > 0 && (
              <div className="text-xs text-orange-500">
                Don't break the chain!
              </div>
            )}
          </div>
        </Card>

        {/* Total Memorized */}
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
          <div className="text-center space-y-2">
            <Award className="h-6 w-6 text-emerald-600 mx-auto" />
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {stats.totalMemorized}
            </div>
            <div className="text-sm text-emerald-600 dark:text-emerald-400">
              Ayahs Memorized
            </div>
            {stats.averagePerDay > 0 && (
              <div className="text-xs text-emerald-500">
                {stats.averagePerDay} avg/day
              </div>
            )}
          </div>
        </Card>

        {/* Best Streak */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <div className="text-center space-y-2">
            <Star className="h-6 w-6 text-purple-600 mx-auto" />
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {stats.bestStreak}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              Best Streak
            </div>
            {stats.currentStreak === stats.bestStreak && stats.currentStreak > 0 && (
              <Badge className="bg-purple-100 text-purple-800 text-xs">
                Personal Best!
              </Badge>
            )}
          </div>
        </Card>

        {/* Days Active */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <div className="text-center space-y-2">
            <Calendar className="h-6 w-6 text-blue-600 mx-auto" />
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {stats.daysActive}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Active Days
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Goals */}
      <div className="space-y-4">
        {/* Weekly Goal */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-emerald-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Weekly Goal
                </span>
              </div>
              <Badge className={`${getProgressColor(stats.weeklyProgress, stats.weeklyGoal)} text-white`}>
                {stats.weeklyProgress}/{stats.weeklyGoal}
              </Badge>
            </div>
            
            <Progress 
              value={(stats.weeklyProgress / stats.weeklyGoal) * 100} 
              className="w-full h-3"
            />
            
            <div className="text-sm text-slate-600 dark:text-slate-400 text-center">
              {stats.weeklyProgress >= stats.weeklyGoal 
                ? '🎉 Weekly goal achieved!' 
                : `${stats.weeklyGoal - stats.weeklyProgress} more to reach your weekly goal`
              }
            </div>
          </div>
        </Card>

        {/* Monthly Goal */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Monthly Goal
                </span>
              </div>
              <Badge className={`${getProgressColor(stats.monthlyProgress, stats.monthlyGoal)} text-white`}>
                {stats.monthlyProgress}/{stats.monthlyGoal}
              </Badge>
            </div>
            
            <Progress 
              value={(stats.monthlyProgress / stats.monthlyGoal) * 100} 
              className="w-full h-3"
            />
            
            <div className="text-sm text-slate-600 dark:text-slate-400 text-center">
              {stats.monthlyProgress >= stats.monthlyGoal 
                ? '🏆 Monthly goal achieved!' 
                : `${stats.monthlyGoal - stats.monthlyProgress} more to reach your monthly goal`
              }
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => onNavigate?.('calendar')}
          variant="outline"
          className="h-16 flex flex-col items-center justify-center space-y-1"
        >
          <Calendar className="h-5 w-5" />
          <span className="text-sm">View Calendar</span>
        </Button>
        
        <Button
          onClick={setupNotifications}
          variant="outline"
          className="h-16 flex flex-col items-center justify-center space-y-1"
        >
          <Clock className="h-5 w-5" />
          <span className="text-sm">Set Reminders</span>
        </Button>
      </div>

      {/* Achievements Section */}
      {(stats.currentStreak >= 7 || stats.totalMemorized >= 50 || stats.bestStreak >= 14) && (
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
              🏆 Achievements Unlocked
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {stats.currentStreak >= 7 && (
                <Badge className="bg-orange-100 text-orange-800">
                  🔥 Week Warrior
                </Badge>
              )}
              {stats.totalMemorized >= 50 && (
                <Badge className="bg-emerald-100 text-emerald-800">
                  📚 Scholar
                </Badge>
              )}
              {stats.bestStreak >= 14 && (
                <Badge className="bg-purple-100 text-purple-800">
                  ⭐ Consistency Master
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HabitTracker;