
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import BottomNavbar from './BottomNavbar';
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle, Award } from 'lucide-react';
import { useAyahData } from '../hooks/useAyahData';
import { surahs } from '../data/surahs';
import { getPageForAyah } from '@/data/mushafPages';
import { useToast } from '@/hooks/use-toast';
import { useMemorizedAyahs } from '@/hooks/useSupabaseData';
import EnhancedStrictAudioPlayer from './enhanced/EnhancedStrictAudioPlayer';

interface MemorizationPageProps {
  selectedAyah: { surah: number; ayah: number };
  onMarkMemorized: (surah: number, ayah: number) => void;
  onNavigate: (page: 'landing' | 'selection' | 'memorization' | 'progress' | 'settings') => void;
  onAyahChange?: (surah: number, ayah: number) => void;
}

const MemorizationPage = ({ selectedAyah, onMarkMemorized, onNavigate, onAyahChange }: MemorizationPageProps) => {
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isMemorized, setIsMemorized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: ayahData, isLoading, error } = useAyahData(selectedAyah.surah, selectedAyah.ayah);
  const { memorizedAyahs } = useMemorizedAyahs();
  const { toast } = useToast();

  // Check if current ayah is already memorized
  useEffect(() => {
    const isAlreadyMemorized = memorizedAyahs.some(
      ayah => ayah.surah_number === selectedAyah.surah && ayah.ayah_number === selectedAyah.ayah
    );
    setIsMemorized(isAlreadyMemorized);
    console.log('Checking if ayah is memorized:', { 
      surah: selectedAyah.surah, 
      ayah: selectedAyah.ayah, 
      isMemorized: isAlreadyMemorized,
      totalMemorized: memorizedAyahs.length
    });
  }, [selectedAyah, memorizedAyahs]);

  const getCurrentSurah = () => surahs.find(s => s.number === selectedAyah.surah);

  const canGoNext = () => {
    const currentSurah = getCurrentSurah();
    if (!currentSurah) return false;
    
    if (selectedAyah.ayah < currentSurah.numberOfAyahs) {
      return true;
    }
    
    return selectedAyah.surah < 114;
  };

  const canGoPrevious = () => {
    if (selectedAyah.ayah > 1) {
      return true;
    }
    
    return selectedAyah.surah > 1;
  };

  const handleNext = () => {
    if (!canGoNext() || !onAyahChange) return;
    
    const currentSurah = getCurrentSurah();
    if (!currentSurah) return;
    
    if (selectedAyah.ayah < currentSurah.numberOfAyahs) {
      onAyahChange(selectedAyah.surah, selectedAyah.ayah + 1);
    } else if (selectedAyah.surah < 114) {
      onAyahChange(selectedAyah.surah + 1, 1);
    }
  };

  const handlePrevious = () => {
    if (!canGoPrevious() || !onAyahChange) return;
    
    if (selectedAyah.ayah > 1) {
      onAyahChange(selectedAyah.surah, selectedAyah.ayah - 1);
    } else if (selectedAyah.surah > 1) {
      const prevSurah = surahs.find(s => s.number === selectedAyah.surah - 1);
      if (prevSurah) {
        onAyahChange(selectedAyah.surah - 1, prevSurah.numberOfAyahs);
      }
    }
  };

  const handleMarkMemorized = async (checked: boolean) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    console.log('Marking ayah as memorized:', { 
      surah: selectedAyah.surah, 
      ayah: selectedAyah.ayah, 
      checked 
    });

    try {
      if (checked && !isMemorized) {
        await onMarkMemorized(selectedAyah.surah, selectedAyah.ayah);
        setIsMemorized(true);
        setShowCelebration(true);
        
        setTimeout(() => {
          setShowCelebration(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error marking ayah as memorized:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaybackComplete = (completedRepeats: number) => {
    console.log(`Playback completed with ${completedRepeats} repeats`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('selection')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 ml-2">Loading Ayah</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading ayah data...</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Surah {selectedAyah.surah}, Ayah {selectedAyah.ayah}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('selection')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 ml-2">Error Loading Ayah</h1>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="p-6 max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Failed to Load Ayah
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Could not load Surah {selectedAyah.surah}, Ayah {selectedAyah.ayah}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
              Please check your internet connection and try again.
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Retry
              </Button>
              <Button 
                variant="outline"
                onClick={() => onNavigate('selection')}
                className="flex-1"
              >
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // No data state
  if (!ayahData) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('selection')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 ml-2">Ayah Not Found</h1>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="p-6 max-w-md mx-auto text-center">
            <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Ayah Not Found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Surah {selectedAyah.surah}, Ayah {selectedAyah.ayah} could not be found.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
              Please select a valid surah and ayah combination.
            </p>
            <Button 
              onClick={() => onNavigate('selection')}
              className="w-full"
            >
              Select Different Ayah
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const currentSurah = getCurrentSurah();
  const pageNumber = getPageForAyah(selectedAyah.surah, selectedAyah.ayah);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center animate-bounce">
            <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              Ayah Memorized! 🎉
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Keep up the great work!
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center py-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => onNavigate('landing')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Page {pageNumber}</Badge>
                {isMemorized && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Memorized
                  </Badge>
                )}
              </div>
            </div>
            
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Surah {currentSurah?.englishName || selectedAyah.surah}, Ayah {selectedAyah.ayah}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {currentSurah?.englishNameTranslation || ''}
            </p>
          </div>

          {/* Arabic Text */}
          <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
            <div className="text-center">
              <p 
                className="text-2xl leading-relaxed text-slate-800 dark:text-slate-200 font-arabic" 
                dir="rtl"
                style={{ fontFamily: 'Amiri, "Times New Roman", serif' }}
              >
                {ayahData?.text}
              </p>
            </div>
          </Card>

          {/* Translation */}
          <Card className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <p className="text-base text-slate-700 dark:text-slate-300 text-center italic leading-relaxed">
              {ayahData?.translation || "Translation not available"}
            </p>
          </Card>

          {/* Transliteration Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="transliteration" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Transliteration
            </Label>
            <Switch
              id="transliteration"
              checked={showTransliteration}
              onCheckedChange={setShowTransliteration}
            />
          </div>

          {/* Transliteration Text */}
          {showTransliteration && (
            <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-800 dark:text-emerald-300 text-center leading-relaxed">
                {ayahData?.transliteration || "Transliteration not available"}
              </p>
            </Card>
          )}

          {/* Enhanced Audio Controls */}
          <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
            {ayahData?.audio ? (
              <EnhancedStrictAudioPlayer
                audioUrl={ayahData.audio}
                defaultRepeatCount={5}
                autoPlay={false}
                onPlaybackComplete={handlePlaybackComplete}
                debugMode={process.env.NODE_ENV === 'development'}
              />
            ) : (
              <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                Audio not available for this ayah
              </div>
            )}
          </Card>

          {/* Mark as Memorized */}
          <Card className="p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="memorized"
                  checked={isMemorized}
                  onCheckedChange={handleMarkMemorized}
                  disabled={isProcessing || isMemorized}
                />
                <Label htmlFor="memorized" className="text-base font-medium text-slate-700 dark:text-slate-300">
                  Mark as Memorized
                </Label>
              </div>
              
              {isMemorized && (
                <Award className="h-5 w-5 text-emerald-600" />
              )}
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={handlePrevious}
              disabled={!canGoPrevious()}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <Button 
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleNext}
              disabled={!canGoNext()}
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNavbar currentPage="memorization" onNavigate={onNavigate} />
    </div>
  );
};

export default MemorizationPage;
