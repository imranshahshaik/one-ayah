import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export const useSurahs = () => {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { supabase } = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    const fetchSurahs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('surahs')
          .select('*')
          .order('number');

        if (error) throw error;
        
        if (mountedRef.current) {
          setSurahs(data || []);
        }
      } catch (err) {
        console.error('Error fetching surahs:', err);
        if (mountedRef.current) {
          setError(err.message);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchSurahs();

    return () => {
      mountedRef.current = false;
    };
  }, [supabase]);

  return { surahs, loading, error };
};

export const useAyahs = (surahNumber) => {
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { supabase } = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!surahNumber) return;
    
    mountedRef.current = true;

    const fetchAyahs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('ayahs')
          .select('*')
          .eq('surah_number', surahNumber)
          .order('ayah_number');

        if (error) throw error;
        
        if (mountedRef.current) {
          setAyahs(data || []);
        }
      } catch (err) {
        console.error('Error fetching ayahs:', err);
        if (mountedRef.current) {
          setError(err.message);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchAyahs();

    return () => {
      mountedRef.current = false;
    };
  }, [surahNumber, supabase]);

  return { ayahs, loading, error };
};

export const useMemorizedAyahs = () => {
  const { user, supabase } = useAuth();
  const [memorizedAyahs, setMemorizedAyahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchMemorizedAyahs = async () => {
    if (!user?.id || !mountedRef.current) {
      setMemorizedAyahs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('memorized_ayahs')
        .select('*')
        .eq('user_id', user.id)
        .order('memorized_at', { ascending: false });

      if (error) throw error;
      
      if (mountedRef.current) {
        setMemorizedAyahs(data || []);
      }
    } catch (err) {
      console.error('Error fetching memorized ayahs:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchMemorizedAyahs();

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id]);

  const addMemorizedAyah = async (surahNumber, ayahNumber) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('memorized_ayahs')
        .insert({
          user_id: user.id,
          surah_number: surahNumber,
          ayah_number: ayahNumber,
          page_number: 1, // Calculate properly in production
        })
        .select()
        .single();

      if (error) throw error;

      if (mountedRef.current) {
        setMemorizedAyahs(prev => [data, ...prev]);
      }

      // Update user progress
      await updateUserProgress(surahNumber, ayahNumber);

      return data;
    } catch (err) {
      console.error('Error adding memorized ayah:', err);
      throw err;
    }
  };

  const updateUserProgress = async (surahNumber, ayahNumber) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          last_visited_surah: surahNumber,
          last_visited_ayah: ayahNumber,
          total_memorized: memorizedAyahs.length + 1,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating user progress:', err);
    }
  };

  return {
    memorizedAyahs,
    loading,
    error,
    addMemorizedAyah,
    refetch: fetchMemorizedAyahs
  };
};

export const useUserProgress = () => {
  const { user, supabase } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchProgress = async () => {
    if (!user?.id || !mountedRef.current) {
      setProgress(null);
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
      
      if (mountedRef.current) {
        setProgress(data);
      }
    } catch (err) {
      console.error('Error fetching user progress:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchProgress();

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id]);

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress
  };
};