import React, { useState, useEffect } from 'react';
import LandingPage from '../components/LandingPage';
import AyahSelectionPage from '../components/AyahSelectionPage';
import EnhancedMemorizationPage from '../components/enhanced/EnhancedMemorizationPage';
import ProgressPage from '../components/ProgressPage';
import SettingsPage from '../components/SettingsPage';
import ReviewScheduler from '../components/ReviewScheduler';
import CalendarTracker from '../components/CalendarTracker';
import PageStitcher from '../components/PageStitcher';
import SettingsManager from '../components/SettingsManager';
import AuthModal from '../components/AuthModal';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../hooks/useAuth';
import { useMemorizedAyahs, useUserProgressData } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';

type Page = 'landing' | 'selection' | 'memorization' | 'progress' | 'settings' | 'review' | 'calendar' | 'pages';

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
  const { memorizedAyahs, addMemorizedAyah } = useMemorizedAyahs();
  const { progress, updateProgress } = useUserProgressData();

  useEffect(() => {
    if (user) {
      loadUserData();
      checkDueReviews();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // If user has progress, set the last visited ayah
      if (progress?.last_ayah) {
        const [surah, ayah] = progress.last_ayah.split(':').map(Number);
        setSelectedAyah({ surah, ayah });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkDueReviews = async () => {
    try {
      // This would be implemented with the spaced repetition system
      // For now, we'll use a placeholder
      setDueReviewsCount(0);
    } catch (error) {
      console.error('Error checking due reviews:', error);
    }
  };

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
  };

  const handleAyahSelection = (surah: number, ayah: number) => {
    setSelectedAyah({ surah, ayah });
    setCurrentPage('memorization');
    
    // Update user progress if logged in
    if (user && updateProgress) {
      updateProgress({
        last_ayah: `${surah}:${ayah}`,
        last_surah: surah,
        last_ayah_number: ayah,
        last_updated: new Date().toISOString()
      });
    }
  };

  const handleContinueFromLanding = (surah: number, ayah: number) => {
    setSelectedAyah({ surah, ayah });
    setCurrentPage('memorization');
  };

  const handleAyahChange = (surah: number, ayah: number) => {
    setSelectedAyah({ surah, ayah });
    
    // Update user progress if logged in
    if (user && updateProgress) {
      updateProgress({
        last_ayah: `${surah}:${ayah}`,
        last_surah: surah,
        last_ayah_number: ayah,
        last_updated: new Date().toISOString()
      });
    }
  };

  const handleMarkAsMemorized = async (surah: number, ayah: number) => {
    if (user && addMemorizedAyah) {
      try {
        await addMemorizedAyah(surah, ayah);
        
        // Update streak
        await supabase.rpc('update_user_streak', { user_uuid: user.id });
        
        console.log(`Ayah ${surah}:${ayah} marked as memorized`);
      } catch (error) {
        console.error('Error marking ayah as memorized:', error);
      }
    }
  };

  const handleStartMemorizing = () => {
    if (user) {
      // Check if user has due reviews first
      if (dueReviewsCount > 0) {
        setCurrentPage('review');
      } else if (progress?.last_ayah) {
        // Continue from where they left off
        const [surah, ayah] = progress.last_ayah.split(':').map(Number);
        setSelectedAyah({ surah, ayah });
        setCurrentPage('memorization');
      } else {
        setCurrentPage('selection');
      }
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setCurrentPage('selection');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage 
            onStartMemorizing={handleStartMemorizing}
            onContinue={handleContinueFromLanding}
            dueReviewsCount={dueReviewsCount}
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
          <EnhancedMemorizationPage
            selectedAyah={selectedAyah}
            onMarkMemorized={handleMarkAsMemorized}
            onNavigate={navigateToPage}
            onAyahChange={handleAyahChange}
          />
        );
      case 'progress':
        return (
          <ProgressPage 
            memorizedAyahs={memorizedAyahs.map(ma => ({ surah: ma.surah_number, ayah: ma.ayah_number }))} 
            onNavigate={navigateToPage} 
          />
        );
      case 'settings':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => navigateToPage('landing')}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ←
                </button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 ml-4">
                  Settings
                </h1>
              </div>
              <SettingsManager />
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => navigateToPage('landing')}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ←
                </button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 ml-4">
                  Review Schedule
                </h1>
              </div>
              <ReviewScheduler 
                onComplete={() => {
                  checkDueReviews();
                  navigateToPage('landing');
                }}
                onNavigate={navigateToPage}
              />
            </div>
          </div>
        );
      case 'calendar':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => navigateToPage('landing')}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ←
                </button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 ml-4">
                  Progress Calendar
                </h1>
              </div>
              <CalendarTracker />
            </div>
          </div>
        );
      case 'pages':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center mb-6">
                <button
                  onClick={() => navigateToPage('landing')}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ←
                </button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 ml-4">
                  Page Progress
                </h1>
              </div>
              <PageStitcher 
                onPageComplete={(pageNumber) => {
                  console.log(`Page ${pageNumber} completed!`);
                }}
                onNavigate={navigateToPage}
              />
            </div>
          </div>
        );
      default:
        return (
          <LandingPage 
            onStartMemorizing={handleStartMemorizing}
            onContinue={handleContinueFromLanding}
            dueReviewsCount={dueReviewsCount}
          />
        );
    }
  };

  if (authLoading) {
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
          <UserMenu 
            onNavigate={navigateToPage}
            dueReviewsCount={dueReviewsCount}
          />
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