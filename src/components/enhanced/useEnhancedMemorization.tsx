
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/SupabaseService';
import { getPageForAyah } from '@/data/mushafPages';

interface MemorizationSession {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  targetRepeats: number;
  completedRepeats: number;
  startTime: Date;
  isMemorized: boolean;
}

export const useEnhancedMemorization = () => {
  const [session, setSession] = useState<MemorizationSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const sessionRef = useRef<MemorizationSession | null>(null);

  const startSession = useCallback((surah: number, ayah: number, targetRepeats: number = 5) => {
    const newSession: MemorizationSession = {
      id: `${surah}-${ayah}-${Date.now()}`,
      surahNumber: surah,
      ayahNumber: ayah,
      targetRepeats,
      completedRepeats: 0,
      startTime: new Date(),
      isMemorized: false,
    };
    
    setSession(newSession);
    sessionRef.current = newSession;
    console.log('[useEnhancedMemorization] Session started:', newSession);
  }, []);

  const updateCompletedRepeats = useCallback((repeats: number) => {
    setSession(prev => {
      if (!prev) return null;
      const updated = { ...prev, completedRepeats: repeats };
      sessionRef.current = updated;
      console.log('[useEnhancedMemorization] Updated repeats:', repeats);
      return updated;
    });
  }, []);

  const markAsMemorized = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    setIsProcessing(true);
    
    try {
      const pageNumber = getPageForAyah(session.surahNumber, session.ayahNumber);
      
      // Add to memorized ayahs in database
      await supabaseService.addMemorizedAyah(
        session.surahNumber,
        session.ayahNumber,
        pageNumber
      );

      // Update daily session
      await supabaseService.updateDailySession({
        ayahs_memorized: 1
      });

      // Update session state
      setSession(prev => {
        if (!prev) return null;
        const updated = { ...prev, isMemorized: true };
        sessionRef.current = updated;
        return updated;
      });

      toast({
        title: '🎉 Ayah Memorized!',
        description: `Surah ${session.surahNumber}, Ayah ${session.ayahNumber} has been added to your collection.`,
      });

      console.log('[useEnhancedMemorization] Ayah marked as memorized successfully');
      return true;
    } catch (error) {
      console.error('[useEnhancedMemorization] Error marking ayah as memorized:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [session, toast]);

  const reviewAyah = useCallback(async (ayahId: string, quality: 'easy' | 'good' | 'hard'): Promise<boolean> => {
    setIsProcessing(true);
    
    try {
      await supabaseService.updateAyahReview(ayahId, quality);
      
      // Update daily session
      await supabaseService.updateDailySession({
        ayahs_reviewed: 1
      });

      console.log('[useEnhancedMemorization] Ayah reviewed successfully:', { ayahId, quality });
      return true;
    } catch (error) {
      console.error('[useEnhancedMemorization] Error reviewing ayah:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to save review. Please try again.',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const endSession = useCallback(() => {
    if (session) {
      console.log('[useEnhancedMemorization] Session ended:', session.id);
    }
    setSession(null);
    sessionRef.current = null;
  }, [session]);

  return {
    session,
    isProcessing,
    startSession,
    updateCompletedRepeats,
    markAsMemorized,
    reviewAyah,
    endSession,
  };
};
