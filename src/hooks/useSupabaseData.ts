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

export interface MemorizedAyah {
  id: string;
  user_id: string;
  ayah_key: string;
  surah_number: number;
  ayah_number: number;
  memorized_at: string;
}

export interface UserProgress {
  user_id: string;
  last_ayah: string;
  last_surah: number;
  last_ayah_number: number;
  streak: number;
  best_streak: number;
  total_memorized: number;
  last_updated: string;
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
      setMemorizedAyahs(data || []);
    } catch (err) {
      console.error('Error fetching memorized ayahs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch memorized ayahs');
    } finally {
      setLoading(false);
    }
  };

  const addMemorizedAyah = async (surahNumber: number, ayahNumber: number) => {
    try {
      const ayahKey = `${surahNumber}:${ayahNumber}`;
      
      const { data, error } = await supabase
        .from('memorized_ayahs')
        .insert({
          ayah_key: ayahKey,
          surah_number: surahNumber,
          ayah_number: ayahNumber
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setMemorizedAyahs(prev => [data, ...prev]);

      // Update user progress
      await updateUserProgress(surahNumber, ayahNumber);

      // Update streak
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('update_user_streak', { user_uuid: user.id });
      }

      return data;
    } catch (err) {
      console.error('Error adding memorized ayah:', err);
      throw err;
    }
  };

  const updateUserProgress = async (surahNumber: number, ayahNumber: number) => {
    try {
      const lastAyah = `${surahNumber}:${ayahNumber}`;
      
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          last_ayah: lastAyah,
          last_surah: surahNumber,
          last_ayah_number: ayahNumber,
          total_memorized: memorizedAyahs.length + 1,
          last_updated: new Date().toISOString()
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
      setProgress(data);
    } catch (err) {
      console.error('Error fetching user progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch progress');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (updates: Partial<UserProgress>) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          ...updates,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      setProgress(data);
      return data;
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