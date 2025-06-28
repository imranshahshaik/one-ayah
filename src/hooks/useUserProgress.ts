
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface MemorizedAyah {
  surah: number;
  ayah: number;
  memorized_at: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  memorized_ayahs: Json;
  current_streak: number;
  best_streak: number;
  last_memorized_date: string | null;
  last_visited_surah: number;
  last_visited_ayah: number;
  total_memorized: number;
  created_at: string;
  updated_at: string;
}

// Helper functions to convert between Json and MemorizedAyah[]
const parseMemorizedAyahs = (json: Json): MemorizedAyah[] => {
  if (!json || !Array.isArray(json)) return [];
  
  return json.map(item => {
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      return {
        surah: typeof item.surah === 'number' ? item.surah : 0,
        ayah: typeof item.ayah === 'number' ? item.ayah : 0,
        memorized_at: typeof item.memorized_at === 'string' ? item.memorized_at : new Date().toISOString(),
      };
    }
    return {
      surah: 0,
      ayah: 0,
      memorized_at: new Date().toISOString(),
    };
  });
};

const serializeMemorizedAyahs = (ayahs: MemorizedAyah[]): Json => {
  return ayahs.map(ayah => ({
    surah: ayah.surah,
    ayah: ayah.ayah,
    memorized_at: ayah.memorized_at,
  }));
};

export const useUserProgress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching progress:', error);
        throw error;
      }

      return data as UserProgress | null;
    },
    enabled: !!user?.id,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (updates: Partial<Pick<UserProgress, 'memorized_ayahs' | 'current_streak' | 'best_streak' | 'last_memorized_date' | 'last_visited_surah' | 'last_visited_ayah' | 'total_memorized'>>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_progress')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress', user?.id] });
    },
  });

  const markAyahMemorized = async (surah: number, ayah: number) => {
    if (!user?.id || !progress) return;

    const newMemorizedAyah: MemorizedAyah = {
      surah,
      ayah,
      memorized_at: new Date().toISOString(),
    };

    const currentMemorizedAyahs = parseMemorizedAyahs(progress.memorized_ayahs);
    const updatedMemorizedAyahs = [...currentMemorizedAyahs, newMemorizedAyah];

    try {
      await updateProgressMutation.mutateAsync({
        memorized_ayahs: serializeMemorizedAyahs(updatedMemorizedAyahs),
        total_memorized: updatedMemorizedAyahs.length,
      });

      // Update streak
      await supabase.rpc('update_user_streak', { user_uuid: user.id });
      
      toast({
        title: 'Ayah Memorized!',
        description: `Surah ${surah}, Ayah ${ayah} has been marked as memorized.`,
      });
    } catch (error) {
      console.error('Error marking ayah as memorized:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const updateLastVisited = async (surah: number, ayah: number) => {
    if (!user?.id) return;

    try {
      await updateProgressMutation.mutateAsync({
        last_visited_surah: surah,
        last_visited_ayah: ayah,
      });
    } catch (error) {
      console.error('Error updating last visited:', error);
    }
  };

  const memorizedAyahs = progress ? parseMemorizedAyahs(progress.memorized_ayahs) : [];

  return {
    progress,
    isLoading,
    markAyahMemorized,
    updateLastVisited,
    memorizedAyahs,
    currentStreak: progress?.current_streak || 0,
    bestStreak: progress?.best_streak || 0,
    totalMemorized: progress?.total_memorized || 0,
  };
};
