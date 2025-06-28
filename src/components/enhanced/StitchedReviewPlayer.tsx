import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, SkipForward, SkipBack, BookOpen, Award } from 'lucide-react';
import { supabaseService, type MemorizedAyah } from '@/services/SupabaseService';
import { getAyahsOnPage, getAyahCountOnPage } from '@/data/mushafPages';
import { useAyahData } from '@/hooks/useAyahData';
import StrictAudioPlayer from './StrictAudioPlayer';

interface StitchedReviewPlayerProps {
  pageNumber?: number;
  onPageComplete?: (pageNumber: number) => void;
  onNavigate?: (page: string) => void;
  debugMode?: boolean;
}

interface PageProgress {
  pageNumber: number;
  totalAyahs: number;
  memorizedAyahs: number;
  completionPercentage: number;
  isComplete: boolean;
}

const StitchedReviewPlayer = ({ 
  pageNumber, 
  onPageComplete, 
  onNavigate, 
  debugMode = false 
}: StitchedReviewPlayerProps) => {
  const [memorizedAyahs, setMemorizedAyahs] = useState<MemorizedAyah[]>([]);
  const [pageProgress, setPageProgress] = useState<PageProgress[]>([]);
  const [selectedPage, setSelectedPage] = useState<number>(pageNumber || 1);
  const [isStitchMode, setIsStitchMode] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const pageAyahs = getAyahsOnPage(selectedPage);
  const memorizedPageAyahs = pageAyahs.filter(ayah => 
    isAyahMemorized(ayah.surah, ayah.ayah)
  );
  const currentAyah = memorizedPageAyahs[currentAyahIndex];

  const { data: ayahData } = useAyahData(
    currentAyah?.surah || 1, 
    currentAyah?.ayah || 1
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (pageNumber) {
      setSelectedPage(pageNumber);
    }
  }, [pageNumber]);

  const debugLog = (message: string, data?: any) => {
    if (debugMode) {
      console.debug(`[StitchedReviewPlayer] ${message}`, data || '');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const ayahs = await supabaseService.getMemorizedAyahs();
      setMemorizedAyahs(ayahs);
      calculatePageProgress(ayahs);
      debugLog('Loaded memorized ayahs', { count: ayahs.length });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePageProgress = (ayahs: MemorizedAyah[]) => {
    const pageMap = new Map<number, { total: number; memorized: number }>();
    
    // Initialize pages 1-20 for demo
    for (let page = 1; page <= 20; page++) {
      const totalAyahs = getAyahCountOnPage(page);
      pageMap.set(page, { total: totalAyahs, memorized: 0 });
    }

    // Count memorized ayahs per page
    ayahs.forEach(ayah => {
      const pageData = pageMap.get(ayah.page_number);
      if (pageData) {
        pageData.memorized++;
      }
    });

    // Convert to progress array
    const progress: PageProgress[] = Array.from(pageMap.entries()).map(([pageNum, data]) => ({
      pageNumber: pageNum,
      totalAyahs: data.total,
      memorizedAyahs: data.memorized,
      completionPercentage: data.total > 0 ? (data.memorized / data.total) * 100 : 0,
      isComplete: data.memorized >= data.total && data.total > 0
    }));

    setPageProgress(progress);
    debugLog('Calculated page progress', { 
      totalPages: progress.length,
      completedPages: progress.filter(p => p.isComplete).length
    });
  };

  const handleStartStitchMode = () => {
    if (memorizedPageAyahs.length === 0) {
      debugLog('No memorized ayahs on this page');
      return;
    }

    setIsStitchMode(true);
    setCurrentAyahIndex(0);
    debugLog('Started stitch mode', { 
      pageNumber: selectedPage,
      memorizedCount: memorizedPageAyahs.length 
    });
  };

  const handleNextAyah = () => {
    if (currentAyahIndex < memorizedPageAyahs.length - 1) {
      setCurrentAyahIndex(prev => prev + 1);
      debugLog('Next ayah', { newIndex: currentAyahIndex + 1 });
    } else {
      // Page review complete
      setIsStitchMode(false);
      setIsAutoPlaying(false);
      debugLog('Page review completed');
      
      if (onPageComplete) {
        onPageComplete(selectedPage);
      }
    }
  };

  const handlePreviousAyah = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(prev => prev - 1);
      debugLog('Previous ayah', { newIndex: currentAyahIndex - 1 });
    }
  };

  const handleAudioComplete = () => {
    debugLog('Audio completed for current ayah');
    
    if (isAutoPlaying) {
      // Auto-advance to next ayah
      setTimeout(() => {
        handleNextAyah();
      }, 1000); // Brief pause between ayahs
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    debugLog('Auto-play toggled', { newState: !isAutoPlaying });
  };

  const isAyahMemorized = (surah: number, ayah: number) => {
    return memorizedAyahs.some(ma => ma.surah_number === surah && ma.ayah_number === ayah);
  };

  const getPageMemorizedCount = (pageNum: number) => {
    return memorizedAyahs.filter(ayah => ayah.page_number === pageNum).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isStitchMode) {
    const progress = memorizedPageAyahs.length > 0 
      ? ((currentAyahIndex + 1) / memorizedPageAyahs.length) * 100 
      : 0;
    
    return (
      <div className="space-y-6">
        {/* Stitch Mode Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Page {selectedPage} Stitched Review
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Ayah {currentAyahIndex + 1} of {memorizedPageAyahs.length} memorized
          </p>
          <div className="mt-4">
            <Progress value={progress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-slate-500 mt-2">
              {Math.round(progress)}% Complete
            </p>
          </div>
        </div>

        {/* Debug Info */}
        {debugMode && (
          <Card className="p-3 bg-slate-100 dark:bg-slate-800">
            <div className="text-xs font-mono space-y-1">
              <div>Page: {selectedPage}</div>
              <div>Total Ayahs on Page: {pageAyahs.length}</div>
              <div>Memorized on Page: {memorizedPageAyahs.length}</div>
              <div>Current Index: {currentAyahIndex}</div>
              <div>Auto-playing: {isAutoPlaying ? 'Yes' : 'No'}</div>
            </div>
          </Card>
        )}

        {/* Auto-play Toggle */}
        <div className="flex justify-center">
          <Button
            variant={isAutoPlaying ? "default" : "outline"}
            onClick={toggleAutoPlay}
            className="flex items-center space-x-2"
          >
            {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isAutoPlaying ? 'Auto-playing' : 'Manual Mode'}</span>
          </Button>
        </div>

        {/* Current Ayah Display */}
        {currentAyah && ayahData && (
          <div className="space-y-4">
            <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Badge variant="outline">
                    Surah {currentAyah.surah}:{currentAyah.ayah}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Memorized
                  </Badge>
                </div>
                
                <p 
                  className="text-2xl leading-relaxed text-slate-800 dark:text-slate-200 font-arabic" 
                  dir="rtl"
                  style={{ fontFamily: 'Amiri, "Times New Roman", serif' }}
                >
                  {ayahData.text}
                </p>
                
                <p className="text-base text-slate-600 dark:text-slate-400 italic">
                  {ayahData.translation}
                </p>
              </div>
            </Card>

            {/* Audio Player */}
            {ayahData.audio && (
              <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
                <StrictAudioPlayer
                  audioUrl={ayahData.audio}
                  defaultRepeatCount={1}
                  autoPlay={isAutoPlaying}
                  onComplete={handleAudioComplete}
                  debugMode={debugMode}
                />
              </Card>
            )}

            {/* Navigation Controls */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePreviousAyah}
                disabled={currentAyahIndex === 0}
                className="flex items-center space-x-2"
              >
                <SkipBack className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <Button
                onClick={() => setIsStitchMode(false)}
                variant="ghost"
              >
                Exit Review
              </Button>

              <Button
                onClick={handleNextAyah}
                className="bg-emerald-600 hover:bg-emerald-700 flex items-center space-x-2"
              >
                <span>{currentAyahIndex === memorizedPageAyahs.length - 1 ? 'Complete' : 'Next'}</span>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Page Overview */}
        <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Page {selectedPage} Overview
          </h3>
          <ScrollArea className="h-32">
            <div className="grid grid-cols-4 gap-2">
              {pageAyahs.map((ayah, index) => (
                <div
                  key={`${ayah.surah}-${ayah.ayah}`}
                  className={`p-2 rounded text-center text-xs ${
                    isAyahMemorized(ayah.surah, ayah.ayah)
                      ? currentAyah?.surah === ayah.surah && currentAyah?.ayah === ayah.ayah
                        ? 'bg-emerald-200 text-emerald-900 ring-2 ring-emerald-500'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  {ayah.surah}:{ayah.ayah}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Stitched Page Review
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Review completed pages with sequential audio playback
        </p>
      </div>

      {/* Page Progress Grid */}
      <div className="grid grid-cols-2 gap-4">
        {pageProgress.slice(0, 10).map((page) => (
          <Card 
            key={page.pageNumber}
            className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
              page.memorizedAyahs >= 2
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                : page.memorizedAyahs > 0
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-white dark:bg-slate-800'
            } ${selectedPage === page.pageNumber ? 'ring-2 ring-emerald-600' : ''}`}
            onClick={() => setSelectedPage(page.pageNumber)}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-slate-600" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Page {page.pageNumber}
                  </span>
                </div>
                
                {page.memorizedAyahs >= 2 && (
                  <Award className="h-5 w-5 text-emerald-600" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>{page.memorizedAyahs} / {page.totalAyahs} memorized</span>
                  <span>{Math.round(page.completionPercentage)}%</span>
                </div>
                <Progress value={page.completionPercentage} className="h-2" />
              </div>

              {page.memorizedAyahs >= 2 ? (
                <Badge className="w-full justify-center bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Ready for Stitching
                </Badge>
              ) : page.memorizedAyahs > 0 ? (
                <Badge className="w-full justify-center bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  Need More Ayahs
                </Badge>
              ) : (
                <Badge variant="outline" className="w-full justify-center">
                  No Progress
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Selected Page Details */}
      {selectedPage && (
        <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Page {selectedPage} - Stitched Review
              </h3>
              
              {getPageMemorizedCount(selectedPage) >= 2 && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Award className="h-4 w-4 mr-1" />
                  Ready
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Ayahs:</span>
                <span className="ml-2 font-semibold">
                  {pageAyahs.length}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Memorized:</span>
                <span className="ml-2 font-semibold">
                  {getPageMemorizedCount(selectedPage)}
                </span>
              </div>
            </div>

            {/* Ayahs on Page */}
            <div className="space-y-2">
              <h4 className="font-medium text-slate-700 dark:text-slate-300">Ayahs on this page:</h4>
              <ScrollArea className="h-24">
                <div className="grid grid-cols-4 gap-2">
                  {pageAyahs.map((ayah, index) => (
                    <div
                      key={`${ayah.surah}-${ayah.ayah}`}
                      className={`p-2 rounded text-center text-sm ${
                        isAyahMemorized(ayah.surah, ayah.ayah)
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {ayah.surah}:{ayah.ayah}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleStartStitchMode}
                disabled={getPageMemorizedCount(selectedPage) < 2}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Stitched Review
                {getPageMemorizedCount(selectedPage) < 2 && (
                  <span className="ml-2 text-xs opacity-75">
                    (Need 2+ ayahs)
                  </span>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onNavigate?.('progress')}
                className="flex-1"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                View Progress
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StitchedReviewPlayer;