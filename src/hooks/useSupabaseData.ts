
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Surah {
  id: number;
  number: number;
  name: string;
  english_name: string;
  english_name_translation: string;
  number_of_ayahs: number;
  revelation_type: string;
}

export interface Ayah {
  id: number;
  surah_number: number;
  ayah_number: number;
  text_arabic: string;
  text_english: string;
  text_transliteration: string;
  page_number: number;
  juz_number: number;
}

// Updated to match actual database schema
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
  review_quality?: string;
  review_count: number;
  created_at: string;
  updated_at: string;
}

// Updated to match actual database schema
export interface UserProgress {
  id: string;
  user_id: string;
  total_memorized: number;
  current_streak: number;
  best_streak: number;
  last_memorized_date: string | null;
  last_visited_surah: number;
  last_visited_ayah: number;
  current_page: number;
  pages_completed: number;
  ayahs_due_review: number;
  created_at: string;
  updated_at: string;
}

// Hook to fetch surahs
export const useSurahs = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('surahs')
          .select('*')
          .order('number');

        if (error) throw error;
        setSurahs(data || []);
      } catch (err) {
        console.error('Error fetching surahs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch surahs');
      } finally {
        setLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  return { surahs, loading, error };
};

// Hook to fetch ayahs for a specific surah
export const useAyahs = (surahNumber?: number) => {
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!surahNumber) return;

    const fetchAyahs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('ayahs')
          .select('*')
          .eq('surah_number', surahNumber)
          .order('ayah_number');

        if (error) throw error;
        setAyahs(data || []);
      } catch (err) {
        console.error('Error fetching ayahs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ayahs');
      } finally {
        setLoading(false);
      }
    };

    fetchAyahs();
  }, [surahNumber]);

  return { ayahs, loading, error };
};

// Hook to manage user's memorized ayahs
export const useMemorizedAyahs = () => {
  const [memorizedAyahs, setMemorizedAyahs] = useState<MemorizedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemorizedAyahs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('memorized_ayahs')
        .select('*')
        .order('memorized_at', { ascending: false });

      if (error) throw error;
      // Map the data to match our interface
      const mappedData: MemorizedAyah[] = (data || []).map(item => ({
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
        review_quality: item.review_quality,
        review_count: item.review_count,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      setMemorizedAyahs(mappedData);
    } catch (err) {
      console.error('Error fetching memorized ayahs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch memorized ayahs');
    } finally {
      setLoading(false);
    }
  };

  const addMemorizedAyah = async (surahNumber: number, ayahNumber: number) => {
    try {
      const { data, error } = await supabase
        .from('memorized_ayahs')
        .insert({
          surah_number: surahNumber,
          ayah_number: ayahNumber,
          page_number: 1, // This should be calculated based on actual page
        })
        .select()
        .single();

      if (error) throw error;

      // Map the returned data to match our interface
      const mappedData: MemorizedAyah = {
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
        review_quality: data.review_quality,
        review_count: data.review_count,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      // Update local state
      setMemorizedAyahs(prev => [mappedData, ...prev]);

      // Update user progress
      await updateUserProgress(surahNumber, ayahNumber);

      // Update streak
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('update_user_streak', { user_uuid: user.id });
      }

      return mappedData;
    } catch (err) {
      console.error('Error adding memorized ayah:', err);
      throw err;
    }
  };

  const updateUserProgress = async (surahNumber: number, ayahNumber: number) => {
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          last_visited_surah: surahNumber,
          last_visited_ayah: ayahNumber,
          total_memorized: memorizedAyahs.length + 1,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating user progress:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchMemorizedAyahs();
  }, []);

  return {
    memorizedAyahs,
    loading,
    error,
    addMemorizedAyah,
    refetch: fetchMemorizedAyahs
  };
};

// Hook to manage user progress
export const useUserProgressData = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Map the data to match our interface
        const mappedData: UserProgress = {
          id: data.id,
          user_id: data.user_id,
          total_memorized: data.total_memorized,
          current_streak: data.current_streak,
          best_streak: data.best_streak,
          last_memorized_date: data.last_memorized_date,
          last_visited_surah: data.last_visited_surah,
          last_visited_ayah: data.last_visited_ayah,
          current_page: data.current_page,
          pages_completed: data.pages_completed,
          ayahs_due_review: data.ayahs_due_review,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setProgress(mappedData);
      }
    } catch (err) {
      console.error('Error fetching user progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (updates: Partial<Omit<UserProgress, 'id' | 'user_id' | 'created_at'>>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          ...updates,
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Map the returned data to match our interface
      const mappedData: UserProgress = {
        id: data.id,
        user_id: data.user_id,
        total_memorized: data.total_memorized,
        current_streak: data.current_streak,
        best_streak: data.best_streak,
        last_memorized_date: data.last_memorized_date,
        last_visited_surah: data.last_visited_surah,
        last_visited_ayah: data.last_visited_ayah,
        current_page: data.current_page,
        pages_completed: data.pages_completed,
        ayahs_due_review: data.ayahs_due_review,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      setProgress(mappedData);
      return mappedData;
    } catch (err) {
      console.error('Error updating progress:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [user?.id]);

  return {
    progress,
    loading,
    error,
    updateProgress,
    refetch: fetchProgress
  };
};
