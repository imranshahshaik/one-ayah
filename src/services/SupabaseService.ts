
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface MemorizedAyah {
  id: string;
  user_id: string;
  surah_number: number;
  ayah_number: number;
  page_number: number;
  memorized_at: string;
  last_reviewed_at?: string;
  ease_factor: number;
  interval_days: number;
  next_review_date: string;
  review_quality?: 'easy' | 'good' | 'hard';
  review_count: number;
}

export interface UserSettings {
  id: string;
  user_id: string;
  playback_count: number;
  dark_mode: boolean;
  font_size: 'small' | 'medium' | 'large' | 'extra-large';
  translation_on: boolean;
  transliteration_on: boolean;
  auto_play: boolean;
  notification_time: string;
  notifications_enabled: boolean;
}

export interface PageCompletion {
  id: string;
  user_id: string;
  page_number: number;
  completed_at: string;
  total_ayahs: number;
}

export interface DailySession {
  id: string;
  user_id: string;
  session_date: string;
  ayahs_memorized: number;
  ayahs_reviewed: number;
  total_time_minutes: number;
  streak_day: number;
}

export interface DueReview {
  id: string;
  surah_number: number;
  ayah_number: number;
  page_number: number;
  days_overdue: number;
}

class SupabaseService {
  // Memorized Ayahs
  async addMemorizedAyah(surah: number, ayah: number, pageNumber: number): Promise<MemorizedAyah | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('memorized_ayahs')
        .insert({
          user_id: user.id,
          surah_number: surah,
          ayah_number: ayah,
          page_number: pageNumber,
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        user_id: data.user_id,
        surah_number: data.surah_number,
        ayah_number: data.ayah_number,
        page_number: data.page_number,
        memorized_at: data.memorized_at,
        last_reviewed_at: data.last_reviewed_at,
        ease_factor: data.ease_factor,
        interval_days: data.interval_days,
        next_review_date: data.next_review_date,
        review_quality: data.review_quality as 'easy' | 'good' | 'hard' | undefined,
        review_count: data.review_count,
      };
    } catch (error) {
      console.error('Error adding memorized ayah:', error);
      return null;
    }
  }

  async getMemorizedAyahs(): Promise<MemorizedAyah[]> {
    try {
      const { data, error } = await supabase
        .from('memorized_ayahs')
        .select('*')
        .order('memorized_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        surah_number: item.surah_number,
        ayah_number: item.ayah_number,
        page_number: item.page_number,
        memorized_at: item.memorized_at,
        last_reviewed_at: item.last_reviewed_at,
        ease_factor: item.ease_factor,
        interval_days: item.interval_days,
        next_review_date: item.next_review_date,
        review_quality: item.review_quality as 'easy' | 'good' | 'hard' | undefined,
        review_count: item.review_count,
      }));
    } catch (error) {
      console.error('Error fetching memorized ayahs:', error);
      return [];
    }
  }

  async updateAyahReview(ayahId: string, quality: 'easy' | 'good' | 'hard'): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_ayah_review', {
        ayah_id: ayahId,
        quality: quality
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating ayah review:', error);
      return false;
    }
  }

  async getDueReviews(): Promise<DueReview[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_due_reviews', {
        user_uuid: user.id
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching due reviews:', error);
      return [];
    }
  }

  // User Settings
  async getUserSettings(): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        return {
          id: data.id,
          user_id: data.user_id,
          playback_count: data.playback_count,
          dark_mode: data.dark_mode,
          font_size: data.font_size as 'small' | 'medium' | 'large' | 'extra-large',
          translation_on: data.translation_on,
          transliteration_on: data.transliteration_on,
          auto_play: data.auto_play,
          notification_time: data.notification_time,
          notifications_enabled: data.notifications_enabled,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        })
        .select()
        .single();

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user settings:', error);
      return false;
    }
  }

  // Page Completions
  async checkPageCompletion(pageNumber: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('check_page_completion', {
        user_uuid: user.id,
        page_num: pageNumber
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking page completion:', error);
      return false;
    }
  }

  async getPageCompletions(): Promise<PageCompletion[]> {
    try {
      const { data, error } = await supabase
        .from('page_completions')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching page completions:', error);
      return [];
    }
  }

  // Daily Sessions
  async updateDailySession(updates: Partial<DailySession>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('daily_sessions')
        .upsert({
          user_id: user.id,
          session_date: today,
          ...updates
        })
        .select()
        .single();

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating daily session:', error);
      return false;
    }
  }

  async getDailySessions(days: number = 30): Promise<DailySession[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('daily_sessions')
        .select('*')
        .gte('session_date', startDate.toISOString().split('T')[0])
        .order('session_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching daily sessions:', error);
      return [];
    }
  }

  // Progress Analytics
  async getProgressStats(): Promise<{
    totalMemorized: number;
    currentStreak: number;
    bestStreak: number;
    pagesCompleted: number;
    dueReviews: number;
  }> {
    try {
      const [memorizedAyahs, pageCompletions, dueReviews, sessions] = await Promise.all([
        this.getMemorizedAyahs(),
        this.getPageCompletions(),
        this.getDueReviews(),
        this.getDailySessions(365)
      ]);

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      const sortedSessions = sessions.sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
      
      for (let i = 0; i < sortedSessions.length; i++) {
        const sessionDate = new Date(sortedSessions[i].session_date);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        
        if (sessionDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
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

      return {
        totalMemorized: memorizedAyahs.length,
        currentStreak,
        bestStreak,
        pagesCompleted: pageCompletions.length,
        dueReviews: dueReviews.length
      };
    } catch (error) {
      console.error('Error fetching progress stats:', error);
      return {
        totalMemorized: 0,
        currentStreak: 0,
        bestStreak: 0,
        pagesCompleted: 0,
        dueReviews: 0
      };
    }
  }
}

export const supabaseService = new SupabaseService();
