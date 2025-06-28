
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface MemorizedAyah {
  surah: number;
  ayah: number;
  memorized_at: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  memorized_ayahs: MemorizedAyah[];
  current_streak: number;
  best_streak: number;
  last_memorized_date: string | null;
  last_visited_surah: number;
  last_visited_ayah: number;
  total_memorized: number;
  created_at: string;
  updated_at: string;
}

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
    mutationFn: async (updates: Partial<UserProgress>) => {
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

    const updatedMemorizedAyahs = [...(progress.memorized_ayahs || []), newMemorizedAyah];

    try {
      await updateProgressMutation.mutateAsync({
        memorized_ayahs: updatedMemorizedAyahs,
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

  return {
    progress,
    isLoading,
    markAyahMemorized,
    updateLastVisited,
    memorizedAyahs: progress?.memorized_ayahs || [],
    currentStreak: progress?.current_streak || 0,
    bestStreak: progress?.best_streak || 0,
    totalMemorized: progress?.total_memorized || 0,
  };
};
