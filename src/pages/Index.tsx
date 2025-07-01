
import React, { useState, useEffect } from 'react';
import LandingPage from '../components/LandingPage';
import AyahSelectionPage from '../components/AyahSelectionPage';
import MemorizationPage from '../components/MemorizationPage';
import ProgressPage from '../components/ProgressPage';
import SettingsPage from '../components/SettingsPage';
import AuthModal from '../components/AuthModal';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../hooks/useAuth';
import { useUserProgressData, useMemorizedAyahs } from '../hooks/useSupabaseData';
import { supabaseService } from '../services/SupabaseService';
import { useToast } from '../hooks/use-toast';

type Page = 'landing' | 'selection' | 'memorization' | 'progress' | 'settings';

interface SelectedAyah {
  surah: number;
  ayah: number;
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah>({ surah: 1, ayah: 1 });
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { progress, loading: progressLoading } = useUserProgressData();
  const { memorizedAyahs, loading: memorizedLoading } = useMemorizedAyahs();
  const { toast } = useToast();

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
        await supabaseService.updateUserSettings({
          // We'll use user_settings to track last visited for now
        });
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
        toast({
          title: '✅ Ayah Memorized!',
          description: `Surah ${surah}, Ayah ${ayah} has been marked as memorized.`,
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
      // Always go to selection page first for authenticated users
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

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage 
            onStartMemorizing={handleStartMemorizing} 
            onContinue={handleContinueFromLanding}
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
      case 'settings':
        return <SettingsPage onNavigate={navigateToPage} />;
      default:
        return (
          <LandingPage 
            onStartMemorizing={handleStartMemorizing} 
            onContinue={handleContinueFromLanding}
          />
        );
    }
  };

  if (authLoading || (user && progressLoading)) {
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
