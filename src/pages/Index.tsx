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
import { supabaseService } from '@/services/SupabaseService';

type Page = 'landing' | 'selection' | 'memorization' | 'progress' | 'settings' | 'review' | 'calendar' | 'pages';

interface SelectedAyah {
  surah: number;
  ayah: number;
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah>({ surah: 1, ayah: 1 });
  const [memorizedAyahs, setMemorizedAyahs] = useState<SelectedAyah[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dueReviewsCount, setDueReviewsCount] = useState(0);
  
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserData();
      checkDueReviews();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load user's last visited ayah and other data
      const memorizedAyahsData = await supabaseService.getMemorizedAyahs();
      const localMemorizedAyahs = memorizedAyahsData.map(ayah => ({
        surah: ayah.surah_number,
        ayah: ayah.ayah_number,
      }));
      setMemorizedAyahs(localMemorizedAyahs);

      // Set last visited ayah if available
      if (memorizedAyahsData.length > 0) {
        const lastMemorized = memorizedAyahsData[0];
        setSelectedAyah({
          surah: lastMemorized.surah_number,
          ayah: lastMemorized.ayah_number + 1 // Next ayah to memorize
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkDueReviews = async () => {
    try {
      const dueReviews = await supabaseService.getDueReviews();
      setDueReviewsCount(dueReviews.length);
      
      // If user has due reviews, suggest reviewing first
      if (dueReviews.length > 0 && currentPage === 'landing') {
        // Could show a notification or badge
      }
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
    
    // Update last visited if user is logged in
    if (user) {
      supabaseService.updateDailySession({
        session_date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleAyahChange = (surah: number, ayah: number) => {
    setSelectedAyah({ surah, ayah });
  };

  const handleMarkAsMemorized = async (surah: number, ayah: number) => {
    const newMemorized = { surah, ayah };
    
    if (user) {
      // This is handled in the EnhancedMemorizationPage
      // Just update local state for immediate UI feedback
      setMemorizedAyahs(prev => [...prev, newMemorized]);
    } else {
      // Save locally for non-authenticated users
      setMemorizedAyahs(prev => [...prev, newMemorized]);
    }
  };

  const handleStartMemorizing = () => {
    if (user) {
      // Check if user has due reviews first
      if (dueReviewsCount > 0) {
        setCurrentPage('review');
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
            memorizedAyahs={memorizedAyahs} 
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
                  // Handle page completion celebration
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