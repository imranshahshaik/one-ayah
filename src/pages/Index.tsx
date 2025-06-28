
import React, { useState, useEffect } from 'react';
import LandingPage from '../components/LandingPage';
import AyahSelectionPage from '../components/AyahSelectionPage';
import MemorizationPage from '../components/MemorizationPage';
import ProgressPage from '../components/ProgressPage';
import SettingsPage from '../components/SettingsPage';
import AuthModal from '../components/AuthModal';
import UserMenu from '../components/UserMenu';
import { useAuth } from '../hooks/useAuth';
import { useUserProgress } from '../hooks/useUserProgress';

type Page = 'landing' | 'selection' | 'memorization' | 'progress' | 'settings';

interface SelectedAyah {
  surah: number;
  ayah: number;
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah>({ surah: 1, ayah: 1 });
  const [memorizedAyahs, setMemorizedAyahs] = useState<SelectedAyah[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const { progress, memorizedAyahs: userMemorizedAyahs, markAyahMemorized, updateLastVisited } = useUserProgress();

  // Sync user progress with local state
  useEffect(() => {
    if (user && progress) {
      // Convert user memorized ayahs to local format
      const localMemorizedAyahs = userMemorizedAyahs.map(ayah => ({
        surah: ayah.surah,
        ayah: ayah.ayah,
      }));
      setMemorizedAyahs(localMemorizedAyahs);

      // Restore last visited ayah
      if (progress.last_visited_surah && progress.last_visited_ayah) {
        setSelectedAyah({
          surah: progress.last_visited_surah,
          ayah: progress.last_visited_ayah,
        });
      }
    }
  }, [user, progress, userMemorizedAyahs]);

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
  };

  const handleAyahSelection = (surah: number, ayah: number) => {
    setSelectedAyah({ surah, ayah });
    setCurrentPage('memorization');
    
    // Update last visited if user is logged in
    if (user) {
      updateLastVisited(surah, ayah);
    }
  };

  const handleAyahChange = (surah: number, ayah: number) => {
    setSelectedAyah({ surah, ayah });
    
    // Update last visited if user is logged in
    if (user) {
      updateLastVisited(surah, ayah);
    }
  };

  const handleMarkAsMemorized = (surah: number, ayah: number) => {
    const newMemorized = { surah, ayah };
    
    if (user) {
      // Save to database
      markAyahMemorized(surah, ayah);
    } else {
      // Save locally for non-authenticated users
      setMemorizedAyahs(prev => [...prev, newMemorized]);
    }
  };

  const handleStartMemorizing = () => {
    if (user) {
      navigateToPage('selection');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    navigateToPage('selection');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onStartMemorizing={handleStartMemorizing} />;
      case 'selection':
        return <AyahSelectionPage onAyahSelect={handleAyahSelection} onBack={() => navigateToPage('landing')} />;
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
        return <ProgressPage memorizedAyahs={memorizedAyahs} onNavigate={navigateToPage} />;
      case 'settings':
        return <SettingsPage onNavigate={navigateToPage} />;
      default:
        return <LandingPage onStartMemorizing={handleStartMemorizing} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
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
