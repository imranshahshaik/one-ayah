
import React, { useState } from 'react';
import LandingPage from '../components/LandingPage';
import AyahSelectionPage from '../components/AyahSelectionPage';
import MemorizationPage from '../components/MemorizationPage';
import ProgressPage from '../components/ProgressPage';

type Page = 'landing' | 'selection' | 'memorization' | 'progress';

interface SelectedAyah {
  surah: number;
  ayah: number;
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedAyah, setSelectedAyah] = useState<SelectedAyah>({ surah: 1, ayah: 1 });
  const [memorizedAyahs, setMemorizedAyahs] = useState<SelectedAyah[]>([]);

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
  };

  const handleAyahSelection = (surah: number, ayah: number) => {
    setSelectedAyah({ surah, ayah });
    setCurrentPage('memorization');
  };

  const handleAyahChange = (surah: number, ayah: number) => {
    setSelectedAyah({ surah, ayah });
  };

  const markAsMemorized = (surah: number, ayah: number) => {
    const newMemorized = { surah, ayah };
    setMemorizedAyahs(prev => [...prev, newMemorized]);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onStartMemorizing={() => navigateToPage('selection')} />;
      case 'selection':
        return <AyahSelectionPage onAyahSelect={handleAyahSelection} onBack={() => navigateToPage('landing')} />;
      case 'memorization':
        return (
          <MemorizationPage
            selectedAyah={selectedAyah}
            onMarkMemorized={markAsMemorized}
            onNavigate={navigateToPage}
            onAyahChange={handleAyahChange}
          />
        );
      case 'progress':
        return <ProgressPage memorizedAyahs={memorizedAyahs} onNavigate={navigateToPage} />;
      default:
        return <LandingPage onStartMemorizing={() => navigateToPage('selection')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {renderCurrentPage()}
    </div>
  );
};

export default Index;
