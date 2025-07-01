
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Play, Pause, RotateCcw, Volume2, CheckCircle } from 'lucide-react';

interface EnhancedStrictAudioPlayerProps {
  audioUrl: string;
  onComplete?: () => void;
  defaultRepeatCount?: number;
  autoPlay?: boolean;
  debugMode?: boolean;
  onPlaybackComplete?: (completedRepeats: number) => void;
}

const EnhancedStrictAudioPlayer = ({ 
  audioUrl, 
  onComplete, 
  defaultRepeatCount = 5,
  autoPlay = false,
  debugMode = false,
  onPlaybackComplete
}: EnhancedStrictAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [repeatCount, setRepeatCount] = useState(defaultRepeatCount.toString());
  const [customRepeatCount, setCustomRepeatCount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [completedRepeats, setCompletedRepeats] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackStateRef = useRef({
    targetRepeats: defaultRepeatCount,
    currentRepeat: 1,
    hasCompleted: false,
    actualCompletedRepeats: 0
  });

  const debugLog = (message: string, data?: any) => {
    if (debugMode) {
      console.debug(`[EnhancedStrictAudioPlayer] ${message}`, data || '');
    }
  };

  useEffect(() => {
    if (audioUrl) {
      initializeAudio();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.pause();
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    playbackStateRef.current.targetRepeats = parseInt(repeatCount);
    debugLog('Repeat count updated', { 
      newTarget: playbackStateRef.current.targetRepeats,
      currentRepeat: playbackStateRef.current.currentRepeat 
    });
  }, [repeatCount]);

  const initializeAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    audioRef.current = new Audio(audioUrl);
    audioRef.current.addEventListener('ended', handleAudioEnded);
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('loadedmetadata', () => {
      debugLog('Audio metadata loaded', { duration: audioRef.current?.duration });
      setAudioProgress(0);
      setOverallProgress(0);
    });

    if (autoPlay && currentRepeat === 1 && !isComplete) {
      setTimeout(() => {
        handlePlayPause();
      }, 500);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
      
      const targetRepeats = playbackStateRef.current.targetRepeats;
      const completedRepeats = playbackStateRef.current.actualCompletedRepeats;
      const currentRepeatProgress = progress / 100;
      const overall = ((completedRepeats + currentRepeatProgress) / targetRepeats) * 100;
      setOverallProgress(Math.min(overall, 100));
      
      debugLog('Progress update', {
        audioProgress: Math.round(progress),
        overallProgress: Math.round(overall),
        currentRepeat: playbackStateRef.current.currentRepeat,
        completedRepeats: playbackStateRef.current.actualCompletedRepeats,
        targetRepeats
      });
    }
  };

  const handleAudioEnded = () => {
    const state = playbackStateRef.current;
    
    // STRICT VALIDATION: Only count as complete if audio fully played
    state.actualCompletedRepeats++;
    setCompletedRepeats(state.actualCompletedRepeats);
    
    debugLog('Audio ended - repeat completed', {
      actualCompletedRepeats: state.actualCompletedRepeats,
      currentRepeat: state.currentRepeat,
      targetRepeats: state.targetRepeats,
      hasCompleted: state.hasCompleted
    });

    if (state.hasCompleted || state.actualCompletedRepeats >= state.targetRepeats) {
      debugLog('Playback complete - all repeats finished', {
        totalCompleted: state.actualCompletedRepeats
      });
      setIsPlaying(false);
      setOverallProgress(100);
      setIsComplete(true);
      state.hasCompleted = true;
      
      if (onPlaybackComplete) {
        onPlaybackComplete(state.actualCompletedRepeats);
      }
      
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // Continue to next repeat
    state.currentRepeat++;
    setCurrentRepeat(state.currentRepeat);
    
    debugLog('Starting next repeat', {
      newRepeat: state.currentRepeat,
      remaining: state.targetRepeats - state.actualCompletedRepeats
    });

    setTimeout(() => {
      if (audioRef.current && !state.hasCompleted) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(error => {
          console.error('Failed to replay audio:', error);
          setIsPlaying(false);
        });
      }
    }, 800);
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        debugLog('Playback paused');
      } else {
        if (isComplete) {
          handleReset();
          return;
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
        debugLog('Playback started', {
          currentRepeat: playbackStateRef.current.currentRepeat,
          targetRepeats: playbackStateRef.current.targetRepeats
        });
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsPlaying(false);
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
    setOverallProgress(0);
    setIsComplete(false);
    setCompletedRepeats(0);
    
    playbackStateRef.current = {
      targetRepeats: parseInt(repeatCount),
      currentRepeat: 1,
      hasCompleted: false,
      actualCompletedRepeats: 0
    };
    
    debugLog('Player reset', {
      targetRepeats: playbackStateRef.current.targetRepeats
    });
  };

  const handleRepeatCountChange = (newCount: string) => {
    if (newCount === 'custom') {
      setShowCustomInput(true);
      return;
    }
    
    setRepeatCount(newCount);
    setShowCustomInput(false);
    
    if (isPlaying) {
      handleReset();
    }
    
    debugLog('Repeat count changed', { newCount });
  };

  const handleCustomRepeatSubmit = () => {
    const customCount = parseInt(customRepeatCount);
    if (customCount && customCount > 0 && customCount <= 100) {
      setRepeatCount(customCount.toString());
      setShowCustomInput(false);
      setCustomRepeatCount('');
      
      if (isPlaying) {
        handleReset();
      }
      
      debugLog('Custom repeat count set', { customCount });
    }
  };

  const targetRepeats = parseInt(repeatCount);
  const displayProgress = isComplete ? 100 : overallProgress;

  return (
    <div className="space-y-4">
      {/* Debug Info */}
      {debugMode && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">
          <div>Target: {playbackStateRef.current.targetRepeats}x</div>
          <div>Current: {playbackStateRef.current.currentRepeat}</div>
          <div>Completed: {playbackStateRef.current.actualCompletedRepeats}</div>
          <div>Audio Progress: {Math.round(audioProgress)}%</div>
          <div>Overall Progress: {Math.round(displayProgress)}%</div>
          <div>Complete: {isComplete ? 'Yes' : 'No'}</div>
          <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          className="h-12 w-12 rounded-full"
          disabled={!audioUrl}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handlePlayPause}
          className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
          disabled={!audioUrl}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>

        <div className="flex items-center space-x-2">
          {isComplete ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <Volume2 className="h-4 w-4 text-slate-600" />
          )}
        </div>
      </div>

      {/* Repeat Count Selector */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Select value={repeatCount} onValueChange={handleRepeatCountChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="3">3x</SelectItem>
              <SelectItem value="5">5x</SelectItem>
              <SelectItem value="10">10x</SelectItem>
              <SelectItem value="20">20x</SelectItem>
              <SelectItem value="50">50x</SelectItem>
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
                placeholder="1-100"
                className="w-20"
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
          <span>
            {isComplete ? (
              `Completed ${completedRepeats}/${targetRepeats} repeats!`
            ) : (
              `Playing ${currentRepeat} • Completed ${completedRepeats}/${targetRepeats}`
            )}
          </span>
          <span>{Math.round(displayProgress)}%</span>
        </div>
        
        {/* Overall Progress */}
        <Progress value={displayProgress} className="w-full h-3" />
        
        {/* Current Audio Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Current Playback</span>
            <span>{Math.round(audioProgress)}%</span>
          </div>
          <Progress value={audioProgress} className="w-full h-1" />
        </div>
      </div>
    </div>
  );
};

export default EnhancedStrictAudioPlayer;
