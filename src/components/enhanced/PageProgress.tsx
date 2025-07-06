import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  Star,
  ArrowLeft
} from 'lucide-react';
import { useMemorizedAyahs } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';

interface PageAyah {
  surah_number: number;
  ayah_number: number;
  text_arabic: string;
  text_english: string;
  isMemorized: boolean;
}

interface PageProgressProps {
  onBack: () => void;
  className?: string;
}

const PageProgress = ({ onBack, className }: PageProgressProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageAyahs, setPageAyahs] = useState<PageAyah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages] = useState(604); // Standard Mushaf has 604 pages
  
  const { memorizedAyahs } = useMemorizedAyahs();

  useEffect(() => {
    loadPageAyahs();
  }, [currentPage, memorizedAyahs]);

  const loadPageAyahs = async () => {
    setIsLoading(true);
    try {
      // Fetch ayahs for the current page
      const { data, error } = await supabase
        .from('ayahs')
        .select('surah_number, ayah_number, text_arabic, text_english')
        .eq('page_number', currentPage)
        .order('surah_number')
        .order('ayah_number');

      if (error) throw error;

      // Mark which ayahs are memorized
      const ayahsWithMemorization = (data || []).map(ayah => ({
        ...ayah,
        isMemorized: memorizedAyahs.some(
          memorized => 
            memorized.surah_number === ayah.surah_number && 
            memorized.ayah_number === ayah.ayah_number
        )
      }));

      setPageAyahs(ayahsWithMemorization);
    } catch (error) {
      console.error('Error loading page ayahs:', error);
      // Fallback: show sample data for demonstration
      setPageAyahs([
        {
          surah_number: 1,
          ayah_number: 1,
          text_arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          text_english: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
          isMemorized: memorizedAyahs.some(m => m.surah_number === 1 && m.ayah_number === 1)
        },
        {
          surah_number: 1,
          ayah_number: 2,
          text_arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
          text_english: '[All] praise is [due] to Allah, Lord of the worlds -',
          isMemorized: memorizedAyahs.some(m => m.surah_number === 1 && m.ayah_number === 2)
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const navigatePage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    } else if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const getPageProgress = () => {
    if (pageAyahs.length === 0) return 0;
    const memorizedCount = pageAyahs.filter(ayah => ayah.isMemorized).length;
    return (memorizedCount / pageAyahs.length) * 100;
  };

  const getMemorizedCount = () => {
    return pageAyahs.filter(ayah => ayah.isMemorized).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 ml-2">
            Page Progress
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 ml-2">
            Page {currentPage}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigatePage('prev')}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-slate-600 dark:text-slate-400 px-2">
            {currentPage} / {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigatePage('next')}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Progress Summary */}
          <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Page {currentPage} Progress
                </h2>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {getMemorizedCount()} / {pageAyahs.length} memorized
                </Badge>
              </div>
              
              <Progress value={getPageProgress()} className="w-full h-3" />
              
              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                {Math.round(getPageProgress())}% of this page memorized
              </div>
            </div>
          </Card>

          {/* Ayahs Display */}
          <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Ayahs on Page {currentPage}
                </h3>
              </div>

              {pageAyahs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 dark:text-slate-400">
                    No ayahs found for this page. This might be because the page data hasn't been populated yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pageAyahs.map((ayah, index) => (
                    <div
                      key={`${ayah.surah_number}-${ayah.ayah_number}`}
                      className={`
                        p-6 rounded-xl border-2 transition-all duration-200
                        ${ayah.isMemorized 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-md' 
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'
                        }
                      `}
                    >
                      <div className="space-y-4">
                        {/* Ayah Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-sm">
                              {ayah.surah_number}:{ayah.ayah_number}
                            </Badge>
                            {ayah.isMemorized && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                <span className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                                  Memorized
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {ayah.isMemorized && (
                            <Star className="h-5 w-5 text-yellow-500 fill-current" />
                          )}
                        </div>

                        {/* Arabic Text */}
                        <div className="text-center">
                          <p 
                            className={`
                              text-2xl leading-relaxed font-arabic
                              ${ayah.isMemorized 
                                ? 'text-emerald-800 dark:text-emerald-200' 
                                : 'text-slate-800 dark:text-slate-200'
                              }
                            `}
                            dir="rtl"
                            style={{ fontFamily: 'Amiri, "Times New Roman", serif' }}
                          >
                            {ayah.text_arabic}
                          </p>
                        </div>

                        {/* English Translation */}
                        <div className="text-center">
                          <p className={`
                            text-base italic leading-relaxed
                            ${ayah.isMemorized 
                              ? 'text-emerald-700 dark:text-emerald-300' 
                              : 'text-slate-600 dark:text-slate-400'
                            }
                          `}>
                            {ayah.text_english || "Translation not available"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Page Navigation */}
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigatePage('prev')}
              disabled={currentPage <= 1}
              className="px-6"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Page
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigatePage('next')}
              disabled={currentPage >= totalPages}
              className="px-6"
            >
              Next Page
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageProgress;