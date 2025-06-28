
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import BottomNavbar from './BottomNavbar';
import { ArrowLeft, ArrowRight, Play, Pause, Loader2 } from 'lucide-react';
import { useAyahData } from '../hooks/useAyahData';
import { surahs } from '../data/surahs';

interface MemorizationPageProps {
  selectedAyah: { surah: number; ayah: number };
  onMarkMemorized: (surah: number, ayah: number) => void;
  onNavigate: (page: 'landing' | 'selection' | 'memorization' | 'progress') => void;
  onAyahChange?: (surah: number, ayah: number) => void;
}

const MemorizationPage = ({ selectedAyah, onMarkMemorized, onNavigate, onAyahChange }: MemorizationPageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [repeatCount, setRepeatCount] = useState('5');
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [isMemorized, setIsMemorized] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { data: ayahData, isLoading, error } = useAyahData(selectedAyah.surah, selectedAyah.ayah);

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
  };

  useEffect(() => {
    if (ayahData?.audio) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(ayahData.audio);
      
      audioRef.current.addEventListener('ended', handleAudioEnded);
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
        audioRef.current.pause();
      }
    };
  }, [ayahData?.audio]);

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
    }
  };

  const handleRepeatCountChange = (newCount: string) => {
    setRepeatCount(newCount);
    // Reset current repeat if it exceeds new limit
    if (currentRepeat > parseInt(newCount)) {
      setCurrentRepeat(1);
    }
  };

  const handleMarkMemorized = () => {
    setIsMemorized(true);
    onMarkMemorized(selectedAyah.surah, selectedAyah.ayah);
  };

  const maxRepeats = parseInt(repeatCount);
  const progressPercentage = Math.min((currentRepeat / maxRepeats) * 100, 100);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading ayah...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load ayah data</p>
          <Button onClick={() => onNavigate('selection')}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!ayahData) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="flex-1 p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center py-4">
            <h1 className="text-lg font-semibold text-slate-800">
              Surah {ayahData.surah.englishName}, Ayah {ayahData.numberInSurah}
            </h1>
            <p className="text-sm text-slate-600">{ayahData.surah.englishNameTranslation}</p>
          </div>

          {/* Arabic Text */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg">
            <div className="text-center">
              <p className="text-2xl leading-relaxed text-slate-800 font-arabic" dir="rtl">
                {ayahData.text}
              </p>
            </div>
          </Card>

          {/* Translation */}
          <Card className="p-4 bg-white/60 backdrop-blur-sm">
            <p className="text-base text-slate-700 text-center italic">
              {ayahData.translation || "Translation not available"}
            </p>
          </Card>

          {/* Transliteration Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="transliteration" className="text-sm font-medium text-slate-700">
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
            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <p className="text-sm text-emerald-800 text-center">
                {ayahData.transliteration || "Transliteration not available"}
              </p>
            </Card>
          )}

          {/* Audio Controls */}
          <Card className="p-4 bg-white/80 backdrop-blur-sm shadow-lg space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePlayPause}
                className="h-12 w-12 rounded-full"
                disabled={!ayahData.audio}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <div className="flex-1">
                <Select value={repeatCount} onValueChange={handleRepeatCountChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                    <SelectItem value="5">5x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Repeating {currentRepeat} of {repeatCount}</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>
          </Card>

          {/* Mark as Memorized */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="memorized"
              checked={isMemorized}
              onChange={handleMarkMemorized}
              className="h-5 w-5 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <Label htmlFor="memorized" className="text-base font-medium text-slate-700">
              Mark as Memorized
            </Label>
          </div>

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
