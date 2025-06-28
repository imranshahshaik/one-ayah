import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, ArrowRight, Brain } from 'lucide-react';
import { supabaseService, type DueReview } from '@/services/SupabaseService';
import { useAyahData } from '@/hooks/useAyahData';
import StrictAudioPlayer from './StrictAudioPlayer';

interface SM2ReviewSystemProps {
  onComplete?: () => void;
  onNavigate?: (page: string) => void;
  debugMode?: boolean;
}

interface SM2Calculation {
  ease_factor: number;
  interval_days: number;
  next_review_date: string;
}

const SM2ReviewSystem = ({ onComplete, onNavigate, debugMode = false }: SM2ReviewSystemProps) => {
  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState<'list' | 'review'>('list');
  const [completedReviews, setCompletedReviews] = useState<string[]>([]);
  const [sm2Debug, setSm2Debug] = useState<SM2Calculation | null>(null);

  useEffect(() => {
    loadDueReviews();
  }, []);

  const loadDueReviews = async () => {
    setIsLoading(true);
    try {
      const reviews = await supabaseService.getDueReviews();
      setDueReviews(reviews);
      debugLog('Loaded due reviews', { count: reviews.length });
    } catch (error) {
      console.error('Error loading due reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const debugLog = (message: string, data?: any) => {
    if (debugMode) {
      console.debug(`[SM2ReviewSystem] ${message}`, data || '');
    }
  };

  const calculateSM2 = (currentEase: number, currentInterval: number, quality: 'easy' | 'good' | 'hard'): SM2Calculation => {
    let q: number;
    let ef = currentEase;
    let interval = currentInterval;

    // Convert quality to numeric value (SM-2 algorithm)
    switch (quality) {
      case 'hard': q = 1; break;
      case 'good': q = 3; break;
      case 'easy': q = 5; break;
      default: q = 3;
    }

    debugLog('SM-2 Input', { currentEase, currentInterval, quality, q });

    // SM-2 Algorithm Implementation
    if (q >= 3) {
      // Correct response
      if (interval === 1) {
        interval = 6;
      } else if (interval === 6) {
        interval = 6;
      } else {
        interval = Math.round(interval * ef);
      }
    } else {
      // Incorrect response - reset interval
      interval = 1;
    }

    // Update ease factor
    ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    
    // Ensure ease factor doesn't go below 1.3
    if (ef < 1.3) {
      ef = 1.3;
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    const result = {
      ease_factor: Math.round(ef * 100) / 100, // Round to 2 decimal places
      interval_days: interval,
      next_review_date: nextReviewDate.toISOString().split('T')[0]
    };

    debugLog('SM-2 Output', result);
    
    if (debugMode) {
      setSm2Debug(result);
    }

    return result;
  };

  const handleStartReview = (index: number) => {
    setCurrentReviewIndex(index);
    setReviewMode('review');
    setSm2Debug(null);
  };

  const handleReviewQuality = async (quality: 'easy' | 'good' | 'hard') => {
    const currentReview = dueReviews[currentReviewIndex];
    if (!currentReview) return;

    try {
      debugLog('Processing review quality', { 
        ayah: `${currentReview.surah_number}:${currentReview.ayah_number}`,
        quality 
      });

      // Get current ayah data for SM-2 calculation
      const memorizedAyahs = await supabaseService.getMemorizedAyahs();
      const currentAyah = memorizedAyahs.find(
        ayah => ayah.surah_number === currentReview.surah_number && 
                ayah.ayah_number === currentReview.ayah_number
      );

      if (currentAyah) {
        // Calculate new SM-2 values
        const sm2Result = calculateSM2(
          currentAyah.ease_factor,
          currentAyah.interval_days,
          quality
        );

        debugLog('Updating ayah with SM-2 results', sm2Result);

        // Update the ayah with new SM-2 values
        await supabaseService.updateAyahReview(currentReview.id, quality);
        
        // Update daily session
        await supabaseService.updateDailySession({
          ayahs_reviewed: 1
        });
      }

      setCompletedReviews(prev => [...prev, currentReview.id]);
      
      // Move to next review or complete
      if (currentReviewIndex < dueReviews.length - 1) {
        setCurrentReviewIndex(prev => prev + 1);
        setSm2Debug(null); // Clear debug for next ayah
      } else {
        // All reviews completed
        setReviewMode('list');
        if (onComplete) {
          onComplete();
        }
        // Reload to get updated list
        loadDueReviews();
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const getOverdueColor = (daysOverdue: number) => {
    if (daysOverdue === 0) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (daysOverdue <= 2) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  };

  const getOverdueText = (daysOverdue: number) => {
    if (daysOverdue === 0) return 'Due today';
    if (daysOverdue === 1) return '1 day overdue';
    return `${daysOverdue} days overdue`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (reviewMode === 'review') {
    const currentReview = dueReviews[currentReviewIndex];
    if (!currentReview) return null;

    return (
      <div className="space-y-6">
        {/* Review Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            SM-2 Review Mode
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Surah {currentReview.surah_number}, Ayah {currentReview.ayah_number}
          </p>
          <div className="mt-4">
            <Progress 
              value={((currentReviewIndex + 1) / dueReviews.length) * 100} 
              className="w-full max-w-md mx-auto"
            />
            <p className="text-sm text-slate-500 mt-2">
              Review {currentReviewIndex + 1} of {dueReviews.length}
            </p>
          </div>
        </div>

        {/* SM-2 Debug Info */}
        {debugMode && sm2Debug && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              SM-2 Algorithm Debug
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-600 dark:text-blue-400">Ease Factor:</span>
                <div className="font-mono">{sm2Debug.ease_factor}</div>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">Interval:</span>
                <div className="font-mono">{sm2Debug.interval_days} days</div>
              </div>
              <div>
                <span className="text-blue-600 dark:text-blue-400">Next Review:</span>
                <div className="font-mono">{sm2Debug.next_review_date}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Ayah Display with Audio */}
        <AyahReviewDisplay 
          surah={currentReview.surah_number}
          ayah={currentReview.ayah_number}
          debugMode={debugMode}
        />

        {/* Review Quality Buttons */}
        <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              How well did you remember this ayah?
            </h3>
            
            <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
              <Button
                onClick={() => handleReviewQuality('easy')}
                className="bg-green-600 hover:bg-green-700 text-white py-3"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Easy - Perfect recall
                <span className="text-xs ml-2 opacity-75">(Increases interval)</span>
              </Button>
              
              <Button
                onClick={() => handleReviewQuality('good')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                <Clock className="h-5 w-5 mr-2" />
                Good - Recalled with effort
                <span className="text-xs ml-2 opacity-75">(Normal interval)</span>
              </Button>
              
              <Button
                onClick={() => handleReviewQuality('hard')}
                className="bg-red-600 hover:bg-red-700 text-white py-3"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                Hard - Struggled to recall
                <span className="text-xs ml-2 opacity-75">(Resets interval)</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-center">
          <Brain className="h-6 w-6 mr-2" />
          SM-2 Spaced Repetition
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {dueReviews.length === 0 
            ? "No reviews due today! Your memory is strong." 
            : `${dueReviews.length} ayah${dueReviews.length === 1 ? '' : 's'} due for review`
          }
        </p>
      </div>

      {dueReviews.length === 0 ? (
        <Card className="p-8 text-center bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
            All caught up!
          </h3>
          <p className="text-green-700 dark:text-green-400 mb-4">
            Your spaced repetition schedule is clear. Time to memorize something new!
          </p>
          <Button 
            onClick={() => onNavigate?.('selection')}
            className="bg-green-600 hover:bg-green-700"
          >
            Start Memorizing
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Quick Review All Button */}
          <div className="text-center">
            <Button
              onClick={() => handleStartReview(0)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
            >
              <Brain className="h-4 w-4 mr-2" />
              Start SM-2 Review Session
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Individual Review Items */}
          <div className="space-y-3">
            {dueReviews.map((review, index) => (
              <Card 
                key={review.id} 
                className={`p-4 transition-all duration-200 hover:shadow-md ${
                  completedReviews.includes(review.id) 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                        Surah {review.surah_number}, Ayah {review.ayah_number}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Page {review.page_number}
                      </p>
                    </div>
                    
                    <Badge className={getOverdueColor(review.days_overdue)}>
                      {getOverdueText(review.days_overdue)}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    {completedReviews.includes(review.id) ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartReview(index)}
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for displaying ayah during review
const AyahReviewDisplay = ({ surah, ayah, debugMode }: { surah: number; ayah: number; debugMode: boolean }) => {
  const { data: ayahData, isLoading, error } = useAyahData(surah, ayah);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !ayahData) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">Failed to load ayah data</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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

      {/* Audio Player */}
      {ayahData.audio && (
        <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
          <StrictAudioPlayer
            audioUrl={ayahData.audio}
            defaultRepeatCount={3}
            autoPlay={false}
            debugMode={debugMode}
          />
        </Card>
      )}
    </div>
  );
};

export default SM2ReviewSystem;