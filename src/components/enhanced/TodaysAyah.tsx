import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  BookOpen, 
  CheckCircle, 
  Star, 
  Calendar,
  ArrowRight,
  Undo2
} from 'lucide-react';
import { useUserProgressData, useMemorizedAyahs } from '@/hooks/useSupabaseData';
import { useAyahData } from '@/hooks/useAyahData';
import { surahs } from '@/data/surahs';
import { useToast } from '@/hooks/use-toast';

interface TodaysAyahProps {
  onStartMemorizing: () => void;
  onMarkAsMemorized: (surah: number, ayah: number) => Promise<void>;
  onNavigate?: (page: string) => void;
  className?: string;
}

const TodaysAyah = ({ 
  onStartMemorizing, 
  onMarkAsMemorized, 
  onNavigate, 
  className 
}: TodaysAyahProps) => {
  const [isMemorized, setIsMemorized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { progress } = useUserProgressData();
  const { memorizedAyahs } = useMemorizedAyahs();
  const { toast } = useToast();

  // Get today's suggested ayah (next in sequence or user's last position)
  const todaysAyah = {
    surah: progress?.last_visited_surah || 1,
    ayah: progress?.last_visited_ayah || 1
  };

  const { data: ayahData } = useAyahData(todaysAyah.surah, todaysAyah.ayah);

  useEffect(() => {
    // Check if today's ayah is already memorized
    const isAlreadyMemorized = memorizedAyahs.some(
      ayah => ayah.surah_number === todaysAyah.surah && ayah.ayah_number === todaysAyah.ayah
    );
    setIsMemorized(isAlreadyMemorized);
  }, [memorizedAyahs, todaysAyah]);

  const getCurrentSurah = () => surahs.find(s => s.number === todaysAyah.surah);

  const handleMarkAsMemorized = async (checked: boolean) => {
    if (isProcessing) return;
    
    if (checked && !isMemorized) {
      setIsProcessing(true);
      try {
        await onMarkAsMemorized(todaysAyah.surah, todaysAyah.ayah);
        setIsMemorized(true);
        setShowSuccess(true);
        
        // Auto-hide success message
        setTimeout(() => {
          setShowSuccess(false);
        }, 1000);
        
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
    }
  };

  const handleUnmarkMemorized = () => {
    // For now, we'll just show a message since unmarking requires more complex logic
    toast({
      title: 'Already Memorized',
      description: 'This ayah is already in your collection. Use the review system to practice it.',
    });
  };

  const currentSurah = getCurrentSurah();
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Card className={`p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg ${className}`}>
      {/* Success Animation */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-in-down">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Ayah memorized! 🎉</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <span className="text-sm text-slate-600 dark:text-slate-400">{today}</span>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Today's Ayah
          </h2>
          
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="outline" className="text-sm">
              Surah {currentSurah?.englishName || todaysAyah.surah}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Ayah {todaysAyah.ayah}
            </Badge>
            {isMemorized && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Memorized
              </Badge>
            )}
          </div>
        </div>

        {/* Ayah Display */}
        {ayahData && (
          <div className="space-y-4">
            {/* Arabic Text */}
            <div className="text-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <p 
                className="text-2xl leading-relaxed text-slate-800 dark:text-slate-200 font-arabic" 
                dir="rtl"
                style={{ fontFamily: 'Amiri, "Times New Roman", serif' }}
              >
                {ayahData.text}
              </p>
            </div>

            {/* Translation */}
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-base text-emerald-800 dark:text-emerald-300 italic leading-relaxed">
                {ayahData.translation || "Translation not available"}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Mark as Memorized */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="memorized"
                checked={isMemorized}
                onCheckedChange={handleMarkAsMemorized}
                disabled={isProcessing || isMemorized}
              />
              <label htmlFor="memorized" className="text-base font-medium text-slate-700 dark:text-slate-300">
                {isMemorized ? 'Memorized ✓' : 'Mark as Memorized'}
              </label>
            </div>
            
            {isMemorized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnmarkMemorized}
                className="text-slate-500 hover:text-slate-700"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Main Action Button */}
          {!isMemorized ? (
            <Button 
              onClick={onStartMemorizing}
              className="w-full py-4 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Start Memorizing
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => onNavigate?.('review')}
                variant="outline"
                className="py-3"
              >
                <Star className="h-4 w-4 mr-2" />
                Review
              </Button>
              <Button 
                onClick={onStartMemorizing}
                className="py-3 bg-emerald-600 hover:bg-emerald-700"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </div>
          )}
        </div>

        {/* Progress Hint */}
        {progress && (
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Your Progress:</strong> {progress.total_memorized || 0} ayahs memorized
              {progress.current_streak > 0 && (
                <span> • {progress.current_streak} day streak 🔥</span>
              )}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TodaysAyah;