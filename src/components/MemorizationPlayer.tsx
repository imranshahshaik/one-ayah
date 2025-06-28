import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Play, Pause, RotateCcw, Volume2, Settings } from 'lucide-react';
import { useAyahData } from '../hooks/useAyahData';

interface MemorizationPlayerProps {
  surah: number;
  ayah: number;
  onComplete?: () => void;
  settings?: {
    playbackCount: number;
    showTransliteration: boolean;
    fontSize: string;
    autoPlay: boolean;
  };
  onSettingsChange?: (settings: any) => void;
}

const MemorizationPlayer = ({ 
  surah, 
  ayah, 
  onComplete,
  settings = {
    playbackCount: 5,
    showTransliteration: true,
    fontSize: 'medium',
    autoPlay: true
  },
  onSettingsChange
}: MemorizationPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [repeatCount, setRepeatCount] = useState(settings.playbackCount.toString());
  const [customRepeatCount, setCustomRepeatCount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(settings.showTransliteration);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { data: ayahData, isLoading, error } = useAyahData(surah, ayah);

  // Font size mapping
  const fontSizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl',
    'extra-large': 'text-4xl'
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

      // Auto-play if enabled
      if (settings.autoPlay && currentRepeat === 1) {
        setTimeout(() => {
          handlePlayPause();
        }, 500);
      }
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
      }, 800); // Slight pause between repetitions
    } else {
      setIsPlaying(false);
      setAudioProgress(100); // Ensure progress shows 100% when complete
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef.current || !ayahData?.audio) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (currentRepeat > parseInt(repeatCount)) {
          setCurrentRepeat(1);
          audioRef.current.currentTime = 0;
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
    if (newCount === 'custom') {
      setShowCustomInput(true);
      return;
    }
    
    setRepeatCount(newCount);
    setShowCustomInput(false);
    
    if (currentRepeat > parseInt(newCount)) {
      setCurrentRepeat(1);
    }

    if (onSettingsChange) {
      onSettingsChange({ ...settings, playbackCount: parseInt(newCount) });
    }
  };

  const handleCustomRepeatSubmit = () => {
    const customCount = parseInt(customRepeatCount);
    if (customCount && customCount > 0 && customCount <= 100) {
      setRepeatCount(customCount.toString());
      setShowCustomInput(false);
      setCustomRepeatCount('');
      
      if (onSettingsChange) {
        onSettingsChange({ ...settings, playbackCount: customCount });
      }
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentRepeat(1);
    setAudioProgress(0);
  };

  const handleTransliterationToggle = (enabled: boolean) => {
    setShowTransliteration(enabled);
    if (onSettingsChange) {
      onSettingsChange({ ...settings, showTransliteration: enabled });
    }
  };

  const maxRepeats = parseInt(repeatCount);
  const overallProgress = Math.min(((currentRepeat - 1) / maxRepeats) * 100 + (audioProgress / maxRepeats), 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !ayahData) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Failed to load ayah data</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Toggle */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="text-slate-600"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="p-4 bg-slate-50 dark:bg-slate-800">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="transliteration" className="text-sm font-medium">
                Show Transliteration
              </Label>
              <Switch
                id="transliteration"
                checked={showTransliteration}
                onCheckedChange={handleTransliterationToggle}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Arabic Text */}
      <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
        <div className="text-center">
          <p 
            className={`${fontSizeClasses[settings.fontSize as keyof typeof fontSizeClasses]} leading-relaxed text-slate-800 dark:text-slate-200 font-arabic`} 
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

      {/* Transliteration */}
      {showTransliteration && (
        <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <p className="text-sm text-emerald-800 dark:text-emerald-300 text-center leading-relaxed">
            {ayahData.transliteration || "Transliteration not available"}
          </p>
        </Card>
      )}

      {/* Audio Controls */}
      <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg space-y-4">
        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="h-12 w-12 rounded-full"
            disabled={!ayahData.audio}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handlePlayPause}
            className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
            disabled={!ayahData.audio}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>

          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-slate-600" />
          </div>
        </div>

        {/* Repeat Count Selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Repeat Count
          </Label>
          <div className="flex space-x-2">
            <Select value={repeatCount} onValueChange={handleRepeatCountChange}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="5">5x</SelectItem>
                <SelectItem value="10">10x</SelectItem>
                <SelectItem value="20">20x</SelectItem>
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
            
            {showCustomInput && (
              <div className="flex space-x-2">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={customRepeatCount}
                  onChange={(e) => setCustomRepeatCount(e.target.value)}
                  placeholder="Enter count"
                  className="w-24"
                />
                <Button size="sm" onClick={handleCustomRepeatSubmit}>
                  Set
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Display */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Repeat {currentRepeat} of {repeatCount}</span>
            <span>{Math.round(overallProgress)}% Complete</span>
          </div>
          
          {/* Overall Progress */}
          <Progress value={overallProgress} className="w-full h-2" />
          
          {/* Current Audio Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Current Playback</span>
              <span>{Math.round(audioProgress)}%</span>
            </div>
            <Progress value={audioProgress} className="w-full h-1" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MemorizationPlayer;