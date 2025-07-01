
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/SupabaseService';
import { getPageForAyah } from '@/data/mushafPages';

interface MemorizationSession {
  surah: number;
  ayah: number;
  startTime: Date;
  completedRepeats: number;
  targetRepeats: number;
  isMemorized: boolean;
}

export const useEnhancedMemorization = () => {
  const [session, setSession] = useState<MemorizationSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const startSession = useCallback((surah: number, ayah: number, targetRepeats: number = 5) => {
    const newSession: MemorizationSession = {
      surah,
      ayah,
      startTime: new Date(),
      completedRepeats: 0,
      targetRepeats,
      isMemorized: false
    };
    
    setSession(newSession);
    console.log('Started memorization session', newSession);
  }, []);

  const updateCompletedRepeats = useCallback((completedRepeats: number) => {
    setSession(prev => prev ? { ...prev, completedRepeats } : null);
    console.log('Updated completed repeats', completedRepeats);
  }, []);

  const markAsMemorized = useCallback(async () => {
    if (!session || isProcessing) return false;

    setIsProcessing(true);
    try {
      const pageNumber = getPageForAyah(session.surah, session.ayah);
      
      // Add to memorized ayahs with SM-2 spaced repetition defaults
      const memorizedAyah = await supabaseService.addMemorizedAyah(
        session.surah, 
        session.ayah, 
        pageNumber
      );

      if (!memorizedAyah) {
        throw new Error('Failed to save memorized ayah');
      }

      // Update daily session
      const sessionDuration = Math.round((Date.now() - session.startTime.getTime()) / 60000); // minutes
      await supabaseService.updateDailySession({
        ayahs_memorized: 1,
        total_time_minutes: sessionDuration
      });

      // Check for page completion
      const isPageComplete = await supabaseService.checkPageCompletion(pageNumber);
      
      setSession(prev => prev ? { ...prev, isMemorized: true } : null);

      // Show appropriate toast
      if (isPageComplete) {
        toast({
          title: '🎉 Page Complete!',
          description: `Congratulations! You've completed page ${pageNumber} of the Mushaf.`,
        });
      } else {
        toast({
          title: '✅ Ayah Memorized!',
          description: `Surah ${session.surah}, Ayah ${session.ayah} has been added to your collection.`,
        });
      }

      return true;
    } catch (error) {
      console.error('Error marking ayah as memorized:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [session, isProcessing, toast]);

  const reviewAyah = useCallback(async (ayahId: string, quality: 'easy' | 'good' | 'hard') => {
    if (isProcessing) return false;

    setIsProcessing(true);
    try {
      const success = await supabaseService.updateAyahReview(ayahId, quality);
      
      if (success) {
        // Update daily session
        await supabaseService.updateDailySession({
          ayahs_reviewed: 1
        });

        const qualityMessages = {
          easy: 'Excellent! This ayah will be reviewed less frequently.',
          good: 'Good job! Review schedule adjusted accordingly.',
          hard: 'No worries! This ayah will be reviewed more frequently to help strengthen your memory.'
        };

        toast({
          title: 'Review Recorded',
          description: qualityMessages[quality],
        });

        return true;
      } else {
        throw new Error('Failed to update review');
      }
    } catch (error) {
      console.error('Error recording review:', error);
      toast({
        title: 'Error',
        description: 'Failed to record review. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, toast]);

  const endSession = useCallback(() => {
    setSession(null);
    console.log('Ended memorization session');
  }, []);

  return {
    session,
    isProcessing,
    startSession,
    updateCompletedRepeats,
    markAsMemorized,
    reviewAyah,
    endSession
  };
};
