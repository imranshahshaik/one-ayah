
import React, { useState, useEffect } from 'react';
import LandingPage from '../components/LandingPage';
import AyahSelectionPage from '../components/AyahSelectionPage';
import MemorizationPage from '../components/MemorizationPage';
import ProgressPage from '../components/ProgressPage';
import SettingsPage from '../components/SettingsPage';
import AuthModal from '../components/AuthModal';
import UserMenu from '../components/UserMenu';
import ReviewScheduler from '../components/ReviewScheduler';
import CalendarTracker from '../components/CalendarTracker';
import { useAuth } from '../hooks/useAuth';
import { useUserProgressData, useMemorizedAyahs } from '../hooks/useSupabaseData';
import { supabaseService } from '../services/SupabaseService';
import { useToast } from '../hooks/use-toast';

type Page = 'landing' | 'selection' | 'memorization' | 'progress' | 'settings' | 'review' | 'calendar';

interface SelectedAyah {
  surah: number;
  ayah: number;
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah>({ surah: 1, ayah: 1 });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dueReviewsCount, setDueReviewsCount] = useState(0);
  
  const { user, loading: authLoading } = useAuth();
  const { progress, loading: progressLoading, refetch: refetchProgress } = useUserProgressData();
  const { memorizedAyahs, loading: memorizedLoading, refetch: refetchMemorized } = useMemorizedAyahs();
  const { toast } = useToast();

  // Load due reviews count for landing page
  useEffect(() => {
    const loadDueReviews = async () => {
      if (user) {
        try {
          const reviews = await supabaseService.getDueReviews();
          setDueReviewsCount(reviews.length);
        } catch (error) {
          console.error('Error loading due reviews:', error);
        }
      }
    };

    loadDueReviews();
  }, [user, memorizedAyahs]); // Refresh when memorized ayahs change

  // Update selected ayah when progress loads
  useEffect(() => {
    if (user && progress && progress.last_visited_surah && progress.last_visited_ayah) {
      setSelectedAyah({
        surah: progress.last_visited_surah,
        ayah: progress.last_visited_ayah,
      });
    }
  }, [user, progress]);

  const navigateToPage = (page: Page) => {
    console.log('Navigating to page:', page);
    
    // Handle authentication check for protected pages
    if (!user && (page === 'progress' || page === 'review' || page === 'calendar')) {
      setShowAuthModal(true);
      return;
    }
    
    setCurrentPage(page);
  };

  const handleAyahSelection = (surah: number, ayah: number) => {
    console.log(`Navigating to memorization page with Surah ${surah}, Ayah ${ayah}`);
    setSelectedAyah({ surah, ayah });
    setCurrentPage('memorization');
    
    // Update last visited if user is logged in
    if (user) {
      updateLastVisitedAyah(surah, ayah);
    }
  };

  const handleAyahChange = (surah: number, ayah: number) => {
    console.log(`Changing ayah to Surah ${surah}, Ayah ${ayah}`);
    setSelectedAyah({ surah, ayah });
    
    // Update last visited if user is logged in
    if (user) {
      updateLastVisitedAyah(surah, ayah);
    }
  };

  const updateLastVisitedAyah = async (surah: number, ayah: number) => {
    try {
      if (user) {
        await supabaseService.updateUserProgress({
          last_visited_surah: surah,
          last_visited_ayah: ayah,
        });
        // Refresh progress data
        refetchProgress();
      }
    } catch (error) {
      console.error('Error updating last visited ayah:', error);
    }
  };

  const handleMarkAsMemorized = async (surah: number, ayah: number) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save your progress.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Marking ayah as memorized:', { surah, ayah });
      
      // Get page number for the ayah
      const pageNumber = 1; // This should be calculated properly
      
      const result = await supabaseService.addMemorizedAyah(surah, ayah, pageNumber);
      
      if (result) {
        // Refresh all data after memorizing
        await Promise.all([
          refetchProgress(),
          refetchMemorized()
        ]);
        
        // Show success with streak info
        const updatedProgress = await supabaseService.getUserProgress();
        const streakMessage = updatedProgress?.current_streak > 1 
          ? ` 🔥 ${updatedProgress.current_streak} day streak!` 
          : '';
          
        toast({
          title: '🎉 Ayah Memorized!',
          description: `Surah ${surah}, Ayah ${ayah} has been added to your collection.${streakMessage}`,
        });
      } else {
        throw new Error('Failed to add memorized ayah');
      }
    } catch (error) {
      console.error('Error marking ayah as memorized:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStartMemorizing = () => {
    console.log('Start memorizing clicked', { user: !!user });
    
    if (user) {
      // Check if there are due reviews first
      if (dueReviewsCount > 0) {
        // Suggest reviewing first but allow continuing
        toast({
          title: '📚 Reviews Available',
          description: `You have ${dueReviewsCount} ayah${dueReviewsCount === 1 ? '' : 's'} due for review. Consider reviewing first!`,
        });
      }
      navigateToPage('selection');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleContinueFromLanding = (surah: number, ayah: number) => {
    console.log('Continue from landing:', { surah, ayah });
    setSelectedAyah({ surah, ayah });
    setCurrentPage('memorization');
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // After successful auth, go to selection page
    navigateToPage('selection');
  };

  const handleReviewComplete = () => {
    // Refresh data after completing reviews
    Promise.all([
      refetchProgress(),
      refetchMemorized()
    ]).then(() => {
      toast({
        title: '🎯 Reviews Complete!',
        description: 'Great job! Your memory is getting stronger.',
      });
      
      // Navigate back to landing or selection
      navigateToPage('landing');
    });
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage 
            onStartMemorizing={handleStartMemorizing} 
            onContinue={handleContinueFromLanding}
            dueReviewsCount={dueReviewsCount}
            onNavigate={navigateToPage}
          />
        );
      case 'selection':
        return (
          <AyahSelectionPage 
            onAyahSelect={handleAyahSelection} 
            onBack={() => navigateToPage('landing')} 
          />
        );
      case 'memorization':
        return (
          <MemorizationPage
            selectedAyah={selectedAyah}
            onMarkMemorized={handleMarkAsMemorized}
            onNavigate={navigateToPage}
            onAyahChange={handleAyahChange}
          />
        );
      case 'progress':
        return (
          <ProgressPage 
            memorizedAyahs={memorizedAyahs.map(ayah => ({
              surah: ayah.surah_number,
              ayah: ayah.ayah_number,
            }))}
            onNavigate={navigateToPage} 
          />
        );
      case 'review':
        return (
          <ReviewScheduler 
            onComplete={handleReviewComplete}
            onNavigate={navigateToPage}
          />
        );
      case 'calendar':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => navigateToPage('landing')}
                  className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ← Back
                </button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  Your Journey
                </h1>
                <div></div>
              </div>
              <CalendarTracker />
            </div>
          </div>
        );
      case 'settings':
        return <SettingsPage onNavigate={navigateToPage} />;
      default:
        return (
          <LandingPage 
            onStartMemorizing={handleStartMemorizing} 
            onContinue={handleContinueFromLanding}
            dueReviewsCount={dueReviewsCount}
            onNavigate={navigateToPage}
          />
        );
    }
  };

  // Temporarily disable loading screen to debug
  const isLoading = false; // authLoading || (user && progressLoading);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading OneAyah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
      {/* User Menu */}
      {user && (
        <div className="absolute top-4 right-4 z-10">
          <UserMenu onNavigate={navigateToPage} />
        </div>
      )}

      {renderCurrentPage()}

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
