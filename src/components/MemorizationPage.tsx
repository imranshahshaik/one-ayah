import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import BottomNavbar from './BottomNavbar';
import { ArrowLeft, ArrowRight, Play, Pause, Loader2, AlertCircle, CheckCircle, Award } from 'lucide-react';
import { useAyahData } from '../hooks/useAyahData';
import { surahs } from '../data/surahs';
import { supabaseService } from '@/services/SupabaseService';
import { getPageForAyah } from '@/data/mushafPages';
import { useToast } from '@/hooks/use-toast';

interface MemorizationPageProps {
  selectedAyah: { surah: number; ayah: number };
  onMarkMemorized: (surah: number, ayah: number) => void;
  onNavigate: (page: 'landing' | 'selection' | 'memorization' | 'progress' | 'settings') => void;
  onAyahChange?: (surah: number, ayah: number) => void;
}

const MemorizationPage = ({ selectedAyah, onMarkMemorized, onNavigate, onAyahChange }: MemorizationPageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [repeatCount, setRepeatCount] = useState('5');
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [isMemorized, setIsMemorized] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { data: ayahData, isLoading, error } = useAyahData(selectedAyah.surah, selectedAyah.ayah);
  const { toast } = useToast();

  const getCurrentSurah = () => surahs.find(s => s.number === selectedAyah.surah);

  const canGoNext = () => {
    const currentSurah = getCurrentSurah();
    if (!currentSurah) return false;
    
    if (selectedAyah.ayah < currentSurah.numberOfAyahs) {
      return true; // Can go to next ayah in same surah
    }
    
    // Check if there's a next surah
    return selectedAyah.surah < 114;
  };

  const canGoPrevious = () => {
    if (selectedAyah.ayah > 1) {
      return true; // Can go to previous ayah in same surah
    }
    
    // Check if there's a previous surah
    return selectedAyah.surah > 1;
  };

  const handleNext = () => {
    if (!canGoNext() || !onAyahChange) return;
    
    const currentSurah = getCurrentSurah();
    if (!currentSurah) return;
    
    if (selectedAyah.ayah < currentSurah.numberOfAyahs) {
      // Go to next ayah in same surah
      onAyahChange(selectedAyah.surah, selectedAyah.ayah + 1);
    } else if (selectedAyah.surah < 114) {
      // Go to first ayah of next surah
      onAyahChange(selectedAyah.surah + 1, 1);
    }
    
    // Reset states for new ayah
    setIsPlaying(false);
    setCurrentRepeat(1);
    setIsMemorized(false);
    setAudioProgress(0);
  };

  const handlePrevious = () => {
    if (!canGoPrevious() || !onAyahChange) return;
    
    if (selectedAyah.ayah > 1) {
      // Go to previous ayah in same surah
      onAyahChange(selectedAyah.surah, selectedAyah.ayah - 1);
    } else if (selectedAyah.surah > 1) {
      // Go to last ayah of previous surah
      const prevSurah = surahs.find(s => s.number === selectedAyah.surah - 1);
      if (prevSurah) {
        onAyahChange(selectedAyah.surah - 1, prevSurah.numberOfAyahs);
      }
    }
    
    // Reset states for new ayah
    setIsPlaying(false);
    setCurrentRepeat(1);
    setIsMemorized(false);
    setAudioProgress(0);
  };

  useEffect(() => {
    if (ayahData?.audio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(ayahData.audio);
      
      audioRef.current.addEventListener('ended', handleAudioEnded);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', () => {
        setAudioProgress(0);
      });
      audioRef.current.addEventListener('loadstart', () => {
        console.log('Audio loading started');
      });
      audioRef.current.addEventListener('canplay', () => {
        console.log('Audio can play');
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.pause();
      }
    };
  }, [ayahData?.audio]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  const handleAudioEnded = () => {
    const maxRepeats = parseInt(repeatCount);
    console.log(`Audio ended. Current repeat: ${currentRepeat}, Max repeats: ${maxRepeats}`);
    
    if (currentRepeat < maxRepeats) {
      setCurrentRepeat(prev => prev + 1);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(error => {
            console.error('Failed to replay audio:', error);
            setIsPlaying(false);
          });
        }
      }, 500);
    } else {
      // Stop playing after reaching the limit
      console.log('Audio playback complete - reached repeat limit');
      setIsPlaying(false);
      setCurrentRepeat(1);
      setAudioProgress(100); // Ensure progress shows 100% when complete
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef.current || !ayahData?.audio) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Reset to first repeat if we're starting fresh
        if (currentRepeat > parseInt(repeatCount)) {
          setCurrentRepeat(1);
        }
        
        if (currentRepeat === 1 && audioRef.current.currentTime === 0) {
          console.log('Starting audio playback');
        }
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsPlaying(false);
      toast({
        title: 'Audio Error',
        description: 'Failed to play audio. Please check your internet connection.',
        variant: 'destructive',
      });
    }
  };

  const handleRepeatCountChange = (newCount: string) => {
    setRepeatCount(newCount);
    // Reset current repeat if it exceeds new limit
    if (currentRepeat > parseInt(newCount)) {
      setCurrentRepeat(1);
    }
  };

  const handleMarkMemorized = async () => {
    try {
      const pageNumber = getPageForAyah(selectedAyah.surah, selectedAyah.ayah);
      
      // Add to database
      await supabaseService.addMemorizedAyah(
        selectedAyah.surah, 
        selectedAyah.ayah, 
        pageNumber
      );

      // Update daily session
      await supabaseService.updateDailySession({
        ayahs_memorized: 1
      });

      // Check for page completion
      const isPageComplete = await supabaseService.checkPageCompletion(pageNumber);
      
      setIsMemorized(true);
      setShowCelebration(true);
      
      // Call parent handler
      onMarkMemorized(selectedAyah.surah, selectedAyah.ayah);

      // Show appropriate toast
      if (isPageComplete) {
        toast({
          title: '🎉 Page Complete!',
          description: `Congratulations! You've completed page ${pageNumber} of the Mushaf.`,
        });
      } else {
        toast({
          title: '✅ Ayah Memorized!',
          description: `Surah ${selectedAyah.surah}, Ayah ${selectedAyah.ayah} has been added to your collection.`,
        });
      }

      // Hide celebration after 3 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);

    } catch (error) {
      console.error('Error marking ayah as memorized:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const maxRepeats = parseInt(repeatCount);
  const overallProgress = Math.min(((currentRepeat - 1) / maxRepeats) * 100 + (audioProgress / maxRepeats), 100);

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
                {ayahData.text}
              </p>
            </div>
          </Card>

          {/* Translation */}
          <Card className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <p className="text-base text-slate-700 dark:text-slate-300 text-center italic leading-relaxed">
              {ayahData.translation || "Translation not available"}
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
                {ayahData.transliteration || "Transliteration not available"}
              </p>
            </Card>
          )}

          {/* Audio Controls */}
          <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePlayPause}
                className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                disabled={!ayahData.audio}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </Button>
              
              <div className="flex-1">
                <Select value={repeatCount} onValueChange={handleRepeatCountChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="5">5x</SelectItem>
                    <SelectItem value="10">10x</SelectItem>
                    <SelectItem value="20">20x</SelectItem>
                    <SelectItem value="50">50x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Repeat {currentRepeat} of {repeatCount}</span>
                <span>{Math.round(overallProgress)}% Complete</span>
              </div>
              <Progress value={overallProgress} className="w-full" />
              
              {/* Current Audio Progress */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500">
                  <span>Current Playback</span>
                  <span>{Math.round(audioProgress)}%</span>
                </div>
                <Progress value={audioProgress} className="w-full h-1" />
              </div>
            </div>
          </Card>

          {/* Mark as Memorized */}
          <Card className="p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="memorized"
                  checked={isMemorized}
                  onChange={handleMarkMemorized}
                  className="h-5 w-5 text-emerald-600 rounded focus:ring-emerald-500"
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