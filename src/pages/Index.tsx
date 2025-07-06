import React, { useState, useEffect } from 'react';
import LandingPage from '../components/LandingPage';
import AyahSelectionPage from '../components/AyahSelectionPage';
import MemorizationPage from '../components/MemorizationPage';
import ProgressPage from '../components/ProgressPage';
import SettingsPage from '../components/SettingsPage';
import AuthModal from '../components/AuthModal';
import UserMenu from '../components/UserMenu';
import ReviewQueue from '../components/enhanced/ReviewQueue';
import InteractiveCalendar from '../components/enhanced/InteractiveCalendar';
import HabitTracker from '../components/enhanced/HabitTracker';
import TodaysAyah from '../components/enhanced/TodaysAyah';
import PageProgress from '../components/enhanced/PageProgress';
import { useAuth } from '../hooks/useAuth';
import { useUserProgressData, useMemorizedAyahs } from '../hooks/useSupabaseData';
import { supabaseService } from '../services/SupabaseService';
import { notificationService } from '../services/NotificationService';
import { useToast } from '../hooks/use-toast';

type Page = 'landing' | 'selection' | 'memorization' | 'progress' | 'settings' | 'review' | 'calendar' | 'habit' | 'pages';

interface SelectedAyah {
  surah: number;
  ayah: number;
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah>({ surah: 1, ayah: 1 });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dueReviewsCount, setDueReviewsCount] = useState(0);
  const [isAppReady, setIsAppReady] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { progress, loading: progressLoading, refetch: refetchProgress } = useUserProgressData();
  const { memorizedAyahs, loading: memorizedLoading, refetch: refetchMemorized } = useMemorizedAyahs();
  const { toast } = useToast();

  // Initialize app when auth is ready
  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        setIsAppReady(true);
        if (user) {
          checkForDueReviews();
          setupNotifications();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  // Load due reviews count and check for immediate review prompt
  useEffect(() => {
    if (user && isAppReady) {
      loadDueReviews();
    } else {
      setDueReviewsCount(0);
    }
  }, [user, memorizedAyahs, isAppReady]);

  // Update selected ayah when progress loads
  useEffect(() => {
    if (user && progress && progress.last_visited_surah && progress.last_visited_ayah && isAppReady) {
      setSelectedAyah({
        surah: progress.last_visited_surah,
        ayah: progress.last_visited_ayah,
      });
    }
  }, [user, progress, isAppReady]);

  const setupNotifications = async () => {
    try {
      const settings = notificationService.loadSettings();
      await notificationService.scheduleDaily(settings);
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const checkForDueReviews = async () => {
    if (!user) return;
    
    try {
      const reviews = await supabaseService.getDueReviews();
      if (reviews.length > 0 && currentPage === 'landing') {
        setShowReviewPrompt(true);
        setTimeout(() => setShowReviewPrompt(false), 10000); // Auto-hide after 10s
      }
    } catch (error) {
      console.error('Error checking for due reviews:', error);
    }
  };

  const loadDueReviews = async () => {
    try {
      const reviews = await supabaseService.getDueReviews();
      setDueReviewsCount(reviews.length);
    } catch (error) {
      console.error('Error loading due reviews:', error);
    }
  };

  const navigateToPage = (page: Page) => {
    console.log('Navigating to page:', page);
    
    // Handle authentication check for protected pages
    if (!user && (page === 'progress' || page === 'review' || page === 'calendar' || page === 'habit' || page === 'pages')) {
      setShowAuthModal(true);
      return;
    }
    
    setCurrentPage(page);
    setShowReviewPrompt(false); // Hide review prompt when navigating
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
      
      const pageNumber = 1; // This should be calculated properly
      const result = await supabaseService.addMemorizedAyah(surah, ayah, pageNumber);
      
      if (result) {
        // Refresh all data after memorizing
        await Promise.all([
          refetchProgress(),
          refetchMemorized(),
          loadDueReviews()
        ]);
        
        // Show success with streak info
        const updatedProgress = await supabaseService.getUserProgress();
        const streakMessage = updatedProgress?.current_streak > 1 
          ? ` 🔥 ${updatedProgress.current_streak} day streak!` 
          : '';
          
        // Show confetti notification
        setTimeout(() => {
          notificationService.showInstant(
            'OneAyah - Achievement!',
            `You memorized Surah ${surah}, Ayah ${ayah}!`
          );
        }, 1000);
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
    console.log('Auth success callback triggered');
    setShowAuthModal(false);
  };

  const handleReviewComplete = () => {
    // Refresh data after completing reviews
    Promise.all([
      refetchProgress(),
      refetchMemorized(),
      loadDueReviews()
    ]).then(() => {
      toast({
        title: '🎯 Reviews Complete!',
        description: 'Great job! Your memory is getting stronger.',
      });
      
      // Navigate back to landing
      navigateToPage('landing');
    });
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <div className="relative">
            <LandingPage 
              onStartMemorizing={handleStartMemorizing} 
              onContinue={handleContinueFromLanding}
              dueReviewsCount={dueReviewsCount}
              onNavigate={navigateToPage}
            />
            
            {/* Review Prompt Overlay */}
            <ReviewQueue
              showPrompt={showReviewPrompt}
              onDismissPrompt={() => setShowReviewPrompt(false)}
              onComplete={handleReviewComplete}
              onNavigate={navigateToPage}
            />
          </div>
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
                  Review Schedule
                </h1>
                <div></div>
              </div>
              <ReviewQueue 
                onComplete={handleReviewComplete}
                onNavigate={navigateToPage}
              />
            </div>
          </div>
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
              <InteractiveCalendar />
            </div>
          </div>
        );
      case 'habit':
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
                  Habit Tracker
                </h1>
                <div></div>
              </div>
              <HabitTracker onNavigate={navigateToPage} />
            </div>
          </div>
        );
      case 'pages':
        return (
          <PageProgress onBack={() => navigateToPage('landing')} />
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

  // Show loading only when auth is loading or app is not ready
  const isLoading = authLoading || !isAppReady;
  
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
          <UserMenu onNavigate={navigateToPage} dueReviewsCount={dueReviewsCount} />
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