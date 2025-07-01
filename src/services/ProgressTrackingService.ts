
import { supabaseService } from './SupabaseService';
import { useToast } from '@/hooks/use-toast';

export interface ProgressMilestone {
  type: 'streak' | 'total' | 'page' | 'consistency';
  value: number;
  title: string;
  description: string;
  emoji: string;
  isAchieved: boolean;
}

export interface DailyMotivation {
  message: string;
  type: 'streak' | 'encouragement' | 'milestone' | 'reminder';
  emoji: string;
}

class ProgressTrackingService {
  private static instance: ProgressTrackingService;

  public static getInstance(): ProgressTrackingService {
    if (!ProgressTrackingService.instance) {
      ProgressTrackingService.instance = new ProgressTrackingService();
    }
    return ProgressTrackingService.instance;
  }

  async checkAndCelebrateMilestones(userId: string): Promise<ProgressMilestone[]> {
    try {
      const progress = await supabaseService.getUserProgress();
      if (!progress) return [];

      const milestones: ProgressMilestone[] = [
        // Streak milestones
        {
          type: 'streak',
          value: 3,
          title: 'Consistency Champion',
          description: '3 days in a row!',
          emoji: '🔥',
          isAchieved: (progress.current_streak || 0) >= 3
        },
        {
          type: 'streak',
          value: 7,
          title: 'Week Warrior',
          description: '7 days streak!',
          emoji: '⭐',
          isAchieved: (progress.current_streak || 0) >= 7
        },
        {
          type: 'streak',
          value: 30,
          title: 'Month Master',
          description: '30 days streak!',
          emoji: '🏆',
          isAchieved: (progress.current_streak || 0) >= 30
        },
        
        // Total memorized milestones
        {
          type: 'total',
          value: 10,
          title: 'First Ten',
          description: '10 ayahs memorized!',
          emoji: '🎯',
          isAchieved: (progress.total_memorized || 0) >= 10
        },
        {
          type: 'total',
          value: 50,
          title: 'Half Century',
          description: '50 ayahs memorized!',
          emoji: '💫',
          isAchieved: (progress.total_memorized || 0) >= 50
        },
        {
          type: 'total',
          value: 100,
          title: 'Century Club',
          description: '100 ayahs memorized!',
          emoji: '👑',
          isAchieved: (progress.total_memorized || 0) >= 100
        },

        // Page completion milestones
        {
          type: 'page',
          value: 1,
          title: 'Page Turner',
          description: 'First page completed!',
          emoji: '📖',
          isAchieved: (progress.pages_completed || 0) >= 1
        },
        {
          type: 'page',
          value: 10,
          title: 'Page Master',
          description: '10 pages completed!',
          emoji: '📚',
          isAchieved: (progress.pages_completed || 0) >= 10
        }
      ];

      return milestones;
    } catch (error) {
      console.error('Error checking milestones:', error);
      return [];
    }
  }

  getDailyMotivation(progress: any): DailyMotivation {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const currentStreak = progress?.current_streak || 0;
    const totalMemorized = progress?.total_memorized || 0;

    // Streak-based motivation
    if (currentStreak >= 7) {
      return {
        message: `Amazing! You're on a ${currentStreak}-day streak. Keep the momentum going!`,
        type: 'streak',
        emoji: '🔥'
      };
    }

    if (currentStreak >= 3) {
      return {
        message: `Great consistency! ${currentStreak} days in a row. You're building a powerful habit!`,
        type: 'streak',
        emoji: '⭐'
      };
    }

    // Weekend motivation
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return {
        message: 'Weekend is perfect for reflection. Take your time with today\'s ayah.',
        type: 'encouragement',
        emoji: '🌅'
      };
    }

    // Milestone proximity
    const nextMilestone = Math.ceil(totalMemorized / 10) * 10;
    const remaining = nextMilestone - totalMemorized;
    
    if (remaining <= 3 && remaining > 0) {
      return {
        message: `So close! Only ${remaining} more ayah${remaining === 1 ? '' : 's'} to reach ${nextMilestone}!`,
        type: 'milestone',
        emoji: '🎯'
      };
    }

    // Default encouragement
    const encouragements = [
      'Every ayah brings you closer to your goal. You\'ve got this!',
      'Your dedication to memorization is inspiring. Keep going!',
      'Small steps daily lead to big achievements. Stay consistent!',
      'The Quran is the best companion for your heart and mind.',
      'Your effort in memorization is a beautiful form of worship.'
    ];

    return {
      message: encouragements[Math.floor(Math.random() * encouragements.length)],
      type: 'encouragement',
      emoji: '💚'
    };
  }

  calculateProgressLevel(totalMemorized: number): { level: number; nextLevelAt: number; progress: number } {
    // Level system: every 25 ayahs = 1 level
    const level = Math.floor(totalMemorized / 25) + 1;
    const nextLevelAt = level * 25;
    const progressInLevel = totalMemorized % 25;
    const progress = (progressInLevel / 25) * 100;
    
    return { level, nextLevelAt, progress };
  }

  async getWeeklyStats(userId: string): Promise<{
    thisWeek: number;
    lastWeek: number;
    trend: 'up' | 'down' | 'same';
  }> {
    try {
      const sessions = await supabaseService.getDailySessions(14);
      
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      
      const thisWeek = sessions
        .filter(s => new Date(s.session_date) >= weekStart)
        .reduce((sum, s) => sum + s.ayahs_memorized, 0);
      
      const lastWeek = sessions
        .filter(s => {
          const date = new Date(s.session_date);
          return date >= lastWeekStart && date < weekStart;
        })
        .reduce((sum, s) => sum + s.ayahs_memorized, 0);
      
      let trend: 'up' | 'down' | 'same' = 'same';
      if (thisWeek > lastWeek) trend = 'up';
      else if (thisWeek < lastWeek) trend = 'down';
      
      return { thisWeek, lastWeek, trend };
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return { thisWeek: 0, lastWeek: 0, trend: 'same' };
    }
  }
}

export const progressTrackingService = ProgressTrackingService.getInstance();
