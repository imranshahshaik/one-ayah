import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, BookOpen, Award, ArrowRight } from 'lucide-react';
import { supabaseService, type MemorizedAyah } from '@/services/SupabaseService';
import { getAyahsOnPage, getAyahCountOnPage } from '@/data/mushafPages';
import { useAyahData } from '@/hooks/useAyahData';

interface PageStitcherProps {
  pageNumber?: number;
  onPageComplete?: (pageNumber: number) => void;
  onNavigate?: (page: string) => void;
}

interface PageProgress {
  pageNumber: number;
  totalAyahs: number;
  memorizedAyahs: number;
  completionPercentage: number;
  isComplete: boolean;
}

const PageStitcher = ({ pageNumber, onPageComplete, onNavigate }: PageStitcherProps) => {
  const [memorizedAyahs, setMemorizedAyahs] = useState<MemorizedAyah[]>([]);
  const [pageProgress, setPageProgress] = useState<PageProgress[]>([]);
  const [selectedPage, setSelectedPage] = useState<number>(pageNumber || 1);
  const [isStitchMode, setIsStitchMode] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const pageAyahs = getAyahsOnPage(selectedPage);
  const currentAyah = pageAyahs[currentAyahIndex];
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const ayahs = await supabaseService.getMemorizedAyahs();
      setMemorizedAyahs(ayahs);
      calculatePageProgress(ayahs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePageProgress = (ayahs: MemorizedAyah[]) => {
    const pageMap = new Map<number, { total: number; memorized: number }>();
    
    // Initialize pages 1-10 for demo
    for (let page = 1; page <= 10; page++) {
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
  };

  const handleStartStitchMode = () => {
    setIsStitchMode(true);
    setCurrentAyahIndex(0);
  };

  const handleNextAyah = () => {
    if (currentAyahIndex < pageAyahs.length - 1) {
      setCurrentAyahIndex(prev => prev + 1);
    } else {
      // Page complete
      setIsStitchMode(false);
      if (onPageComplete) {
        onPageComplete(selectedPage);
      }
    }
  };

  const handlePreviousAyah = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(prev => prev - 1);
    }
  };

  const getPageMemorizedAyahs = (pageNum: number) => {
    return memorizedAyahs.filter(ayah => ayah.page_number === pageNum);
  };

  const isAyahMemorized = (surah: number, ayah: number) => {
    return memorizedAyahs.some(ma => ma.surah_number === surah && ma.ayah_number === ayah);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isStitchMode) {
    const progress = ((currentAyahIndex + 1) / pageAyahs.length) * 100;
    
    return (
      <div className="space-y-6">
        {/* Stitch Mode Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Page {selectedPage} Review
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Ayah {currentAyahIndex + 1} of {pageAyahs.length}
          </p>
          <div className="mt-4">
            <Progress value={progress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-slate-500 mt-2">
              {Math.round(progress)}% Complete
            </p>
          </div>
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
                  {isAyahMemorized(currentAyah.surah, currentAyah.ayah) && (
                    <Badge className="bg-green-100 text-green-800">
                      Memorized
                    </Badge>
                  )}
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

            {/* Navigation Controls */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePreviousAyah}
                disabled={currentAyahIndex === 0}
              >
                Previous
              </Button>

              <Button
                onClick={() => setIsStitchMode(false)}
                variant="ghost"
              >
                Exit Review
              </Button>

              <Button
                onClick={handleNextAyah}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {currentAyahIndex === pageAyahs.length - 1 ? 'Complete' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Page Progress
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Review completed pages and stitch ayahs together
        </p>
      </div>

      {/* Page Progress Grid */}
      <div className="grid grid-cols-2 gap-4">
        {pageProgress.map((page) => (
          <Card 
            key={page.pageNumber}
            className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
              page.isComplete 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
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
                
                {page.isComplete && (
                  <Award className="h-5 w-5 text-green-600" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>{page.memorizedAyahs} / {page.totalAyahs} ayahs</span>
                  <span>{Math.round(page.completionPercentage)}%</span>
                </div>
                <Progress value={page.completionPercentage} className="h-2" />
              </div>

              {page.isComplete && (
                <Badge className="w-full justify-center bg-green-100 text-green-800">
                  Complete
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
                Page {selectedPage} Details
              </h3>
              
              {pageProgress.find(p => p.pageNumber === selectedPage)?.isComplete && (
                <Badge className="bg-green-100 text-green-800">
                  <Award className="h-4 w-4 mr-1" />
                  Complete
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Ayahs:</span>
                <span className="ml-2 font-semibold">
                  {pageProgress.find(p => p.pageNumber === selectedPage)?.totalAyahs || 0}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Memorized:</span>
                <span className="ml-2 font-semibold">
                  {pageProgress.find(p => p.pageNumber === selectedPage)?.memorizedAyahs || 0}
                </span>
              </div>
            </div>

            {/* Ayahs on Page */}
            <div className="space-y-2">
              <h4 className="font-medium text-slate-700 dark:text-slate-300">Ayahs on this page:</h4>
              <div className="grid grid-cols-3 gap-2">
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
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleStartStitchMode}
                disabled={pageAyahs.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Review Page
              </Button>
              
              {pageProgress.find(p => p.pageNumber === selectedPage)?.isComplete && (
                <Button
                  variant="outline"
                  onClick={() => onNavigate?.('progress')}
                  className="flex-1"
                >
                  <Award className="h-4 w-4 mr-2" />
                  View Achievement
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PageStitcher;