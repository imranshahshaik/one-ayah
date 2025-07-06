import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, Square, Play, Pause, Trash2, Volume2 } from 'lucide-react';
import { recordingService, type Recording } from '@/services/RecordingService';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  surah: number;
  ayah: number;
  originalAudioUrl?: string;
  className?: string;
}

const VoiceRecorder = ({ surah, ayah, originalAudioUrl, className }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isPlayingOriginal, setIsPlayingOriginal] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const recordingTimerRef = useRef<number>();
  const playbackTimerRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement>();
  const originalAudioRef = useRef<HTMLAudioElement>();
  
  const { toast } = useToast();

  useEffect(() => {
    // Load existing recording
    const existingRecording = recordingService.getRecording(surah, ayah);
    setRecording(existingRecording);

    return () => {
      // Cleanup timers
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
      
      // Stop any playing audio
      recordingService.stopCurrentPlayback();
      if (originalAudioRef.current) {
        originalAudioRef.current.pause();
      }
    };
  }, [surah, ayah]);

  const startRecording = async () => {
    const success = await recordingService.startRecording();
    if (success) {
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: '🎤 Recording Started',
        description: 'Speak clearly and recite the ayah',
      });
    } else {
      toast({
        title: 'Recording Failed',
        description: 'Please allow microphone access',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    setIsRecording(false);
    const newRecording = await recordingService.stopRecording(surah, ayah);
    
    if (newRecording) {
      setRecording(newRecording);
      toast({
        title: '✅ Recording Saved',
        description: 'Your recitation has been saved locally',
      });
    }
  };

  const playRecording = async () => {
    if (!recording) return;

    try {
      if (isPlayingRecording) {
        recordingService.stopCurrentPlayback();
        setIsPlayingRecording(false);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
        }
        return;
      }

      const audio = await recordingService.playRecording(recording);
      audioRef.current = audio;
      
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };
      
      audio.onplay = () => {
        setIsPlayingRecording(true);
        playbackTimerRef.current = window.setInterval(() => {
          setPlaybackTime(audio.currentTime);
        }, 100);
      };
      
      audio.onpause = () => {
        setIsPlayingRecording(false);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
        }
      };
      
      audio.onended = () => {
        setIsPlayingRecording(false);
        setPlaybackTime(0);
        if (playbackTimerRef.current) {
          clearInterval(playbackTimerRef.current);
        }
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing recording:', error);
      toast({
        title: 'Playback Error',
        description: 'Failed to play recording',
        variant: 'destructive',
      });
    }
  };

  const playOriginal = async () => {
    if (!originalAudioUrl) return;

    if (isPlayingOriginal) {
      if (originalAudioRef.current) {
        originalAudioRef.current.pause();
      }
      setIsPlayingOriginal(false);
      return;
    }

    try {
      if (originalAudioRef.current) {
        originalAudioRef.current.pause();
      }
      
      originalAudioRef.current = new Audio(originalAudioUrl);
      
      originalAudioRef.current.onplay = () => {
        setIsPlayingOriginal(true);
      };
      
      originalAudioRef.current.onpause = () => {
        setIsPlayingOriginal(false);
      };
      
      originalAudioRef.current.onended = () => {
        setIsPlayingOriginal(false);
      };
      
      await originalAudioRef.current.play();
    } catch (error) {
      console.error('Error playing original audio:', error);
      toast({
        title: 'Playback Error',
        description: 'Failed to play original audio',
        variant: 'destructive',
      });
    }
  };

  const deleteRecording = () => {
    if (recording) {
      recordingService.deleteRecording(surah, ayah);
      setRecording(null);
      setPlaybackTime(0);
      setDuration(0);
      
      toast({
        title: '🗑️ Recording Deleted',
        description: 'Your recording has been removed',
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm ${className}`}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            🎤 Voice Recording
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Record your recitation and compare with the original
          </p>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <div className="text-center space-y-2">
              <Button
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </Button>
              <div className="text-sm text-red-600 font-medium">
                Recording: {formatTime(recordingTime)}
              </div>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        {recording && (
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Your Recording
              </p>
              
              <div className="flex justify-center space-x-2 mb-3">
                <Button
                  onClick={playRecording}
                  variant="outline"
                  size="sm"
                >
                  {isPlayingRecording ? (
                    <Pause className="h-4 w-4 mr-1" />
                  ) : (
                    <Play className="h-4 w-4 mr-1" />
                  )}
                  {isPlayingRecording ? 'Pause' : 'Play'} Your Voice
                </Button>
                
                {originalAudioUrl && (
                  <Button
                    onClick={playOriginal}
                    variant="outline"
                    size="sm"
                  >
                    {isPlayingOriginal ? (
                      <Pause className="h-4 w-4 mr-1" />
                    ) : (
                      <Volume2 className="h-4 w-4 mr-1" />
                    )}
                    {isPlayingOriginal ? 'Pause' : 'Play'} Original
                  </Button>
                )}
                
                <Button
                  onClick={deleteRecording}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {duration > 0 && (
                <div className="space-y-2">
                  <Progress 
                    value={(playbackTime / duration) * 100} 
                    className="w-full h-2"
                  />
                  <div className="text-xs text-slate-500">
                    {formatTime(playbackTime)} / {formatTime(duration)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> Record in a quiet environment for best results. 
            Compare your pronunciation with the original to improve your Tajweed.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default VoiceRecorder;