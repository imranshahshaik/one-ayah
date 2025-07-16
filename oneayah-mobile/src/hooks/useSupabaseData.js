import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';

export const useSurahs = () => {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { supabase, isInitialized } = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!isInitialized) return;
    
    mountedRef.current = true;
    
    const fetchSurahs = async () => {
      try {
        console.log('🔄 Fetching surahs...');
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('surahs')
          .select('*')
          .order('number');

        if (error) throw error;
        
        if (mountedRef.current) {
          console.log('✅ Surahs fetched:', data?.length || 0);
          setSurahs(data || []);
        }
      } catch (err) {
        console.error('❌ Error fetching surahs:', err);
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
  }, [supabase, isInitialized]);

  return { surahs, loading, error };
};

export const useUserProgress = () => {
  const { user, supabase, isInitialized } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchProgress = async () => {
    if (!user?.id || !mountedRef.current || !isInitialized) {
      setProgress(null);
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching user progress for:', user.id);
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (mountedRef.current) {
        console.log('✅ User progress fetched:', data ? 'Found' : 'Not found');
        setProgress(data);
      }
    } catch (err) {
      console.error('❌ Error fetching user progress:', err);
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
    
    if (isInitialized) {
      fetchProgress();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, isInitialized]);

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress
  };
};

export const useMemorizedAyahs = () => {
  const { user, supabase, isInitialized } = useAuth();
  const [memorizedAyahs, setMemorizedAyahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchMemorizedAyahs = async () => {
    if (!user?.id || !mountedRef.current || !isInitialized) {
      setMemorizedAyahs([]);
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching memorized ayahs for user:', user.id);
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('memorized_ayahs')
        .select('*')
        .eq('user_id', user.id)
        .order('memorized_at', { ascending: false });

      if (error) throw error;
      
      if (mountedRef.current) {
        console.log('✅ Memorized ayahs fetched:', data?.length || 0);
        setMemorizedAyahs(data || []);
      }
    } catch (err) {
      console.error('❌ Error fetching memorized ayahs:', err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const addMemorizedAyah = async (surahNumber, ayahNumber) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('🔄 Adding memorized ayah:', { surahNumber, ayahNumber });
      
      const { data, error } = await supabase
        .from('memorized_ayahs')
        .insert({
          user_id: user.id,
          surah_number: surahNumber,
          ayah_number: ayahNumber,
          page_number: 1,
        })
        .select()
        .single();

      if (error) throw error;

      if (mountedRef.current) {
        setMemorizedAyahs(prev => [data, ...prev]);
      }

      console.log('✅ Ayah memorized successfully');
      return data;
    } catch (err) {
      console.error('❌ Error adding memorized ayah:', err);
      throw err;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    if (isInitialized) {
      fetchMemorizedAyahs();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, isInitialized]);

  return {
    memorizedAyahs,
    loading,
    error,
    addMemorizedAyah,
    refetch: fetchMemorizedAyahs
  };
};