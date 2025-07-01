import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Calendar } from 'lucide-react';
import { supabaseService, type DueReview } from '@/services/SupabaseService';
import { useAyahData } from '@/hooks/useAyahData';
import EnhancedStrictAudioPlayer from './enhanced/EnhancedStrictAudioPlayer';
import SM2ReviewButton from './enhanced/SM2ReviewButton';
import { useEnhancedMemorization } from './enhanced/useEnhancedMemorization';

interface ReviewSchedulerProps {
  onComplete?: () => void;
  onNavigate?: (page: string) => void;
}

const ReviewScheduler = ({ onComplete, onNavigate }: ReviewSchedulerProps) => {
  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState<'list' | 'review'>('list');
  const [completedReviews, setCompletedReviews] = useState<string[]>([]);

  const { reviewAyah, isProcessing } = useEnhancedMemorization();

  useEffect(() => {
    loadDueReviews();
  }, []);

  const loadDueReviews = async () => {
    setIsLoading(true);
    try {
      const reviews = await supabaseService.getDueReviews();
      setDueReviews(reviews);
    } catch (error) {
      console.error('Error loading due reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartReview = (index: number) => {
    setCurrentReviewIndex(index);
    setReviewMode('review');
  };

  const handleReviewQuality = async (quality: 'easy' | 'good' | 'hard') => {
    const currentReview = dueReviews[currentReviewIndex];
    if (!currentReview || isProcessing) return;

    const success = await reviewAyah(currentReview.id, quality);
    
    if (success) {
      setCompletedReviews(prev => [...prev, currentReview.id]);
      
      // Move to next review or complete
      if (currentReviewIndex < dueReviews.length - 1) {
        setCurrentReviewIndex(prev => prev + 1);
      } else {
        // All reviews completed
        setReviewMode('list');
        if (onComplete) {
          onComplete();
        }
        // Reload to get updated list
        loadDueReviews();
      }
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

    return <ReviewModeContent 
      currentReview={currentReview}
      currentReviewIndex={currentReviewIndex}
      totalReviews={dueReviews.length}
      onReviewQuality={handleReviewQuality}
      isProcessing={isProcessing}
    />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Calendar className="h-6 w-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Review Schedule
          </h2>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          {dueReviews.length === 0 
            ? "No reviews due today! Great job staying on track." 
            : `${dueReviews.length} ayah${dueReviews.length === 1 ? '' : 's'} due for review`
          }
        </p>
      </div>

      {dueReviews.length === 0 ? (
        <Card className="p-8 text-center bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
              All caught up!
            </h3>
            <p className="text-green-700 dark:text-green-400 mb-4">
              You've completed all your reviews for today. Time to memorize something new!
            </p>
            <Button 
              onClick={() => onNavigate?.('selection')}
              className="bg-green-600 hover:bg-green-700"
            >
              Start Memorizing
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Quick Review All Button */}
          <div className="text-center">
            <Button
              onClick={() => handleStartReview(0)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
            >
              Start Review Session
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Individual Review Items */}
          <div className="space-y-3">
            {dueReviews.map((review, index) => (
              <ReviewCard
                key={review.id}
                review={review}
                index={index}
                isCompleted={completedReviews.includes(review.id)}
                onStartReview={handleStartReview}
                getOverdueColor={getOverdueColor}
                getOverdueText={getOverdueText}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Separate component for review mode to keep the main component manageable
const ReviewModeContent = ({ 
  currentReview, 
  currentReviewIndex, 
  totalReviews, 
  onReviewQuality, 
  isProcessing 
}: {
  currentReview: DueReview;
  currentReviewIndex: number;
  totalReviews: number;
  onReviewQuality: (quality: 'easy' | 'good' | 'hard') => void;
  isProcessing: boolean;
}) => {
  const { data: ayahData } = useAyahData(currentReview.surah_number, currentReview.ayah_number);

  return (
    <div className="space-y-6">
      {/* Review Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Review Mode
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Surah {currentReview.surah_number}, Ayah {currentReview.ayah_number}
        </p>
        <div className="mt-4">
          <Progress 
            value={((currentReviewIndex + 1) / totalReviews) * 100} 
            className="w-full max-w-md mx-auto"
          />
          <p className="text-sm text-slate-500 mt-2">
            Review {currentReviewIndex + 1} of {totalReviews}
          </p>
        </div>
      </div>

      {/* Ayah Display */}
      {ayahData && (
        <div className="space-y-4">
          <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Badge variant="outline">
                  Surah {currentReview.surah_number}:{currentReview.ayah_number}
                </Badge>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  {currentReview.days_overdue === 0 ? 'Due Today' : `${currentReview.days_overdue} days overdue`}
                </Badge>
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

          {/* Audio Player */}
          {ayahData.audio && (
            <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
              <EnhancedStrictAudioPlayer
                audioUrl={ayahData.audio}
                defaultRepeatCount={1}
                autoPlay={false}
                debugMode={false}
              />
            </Card>
          )}

          {/* Review Quality Buttons */}
          <SM2ReviewButton
            onReviewQuality={onReviewQuality}
            disabled={isProcessing}
          />
        </div>
      )}
    </div>
  );
};

// Separate component for review cards
const ReviewCard = ({ 
  review, 
  index, 
  isCompleted, 
  onStartReview, 
  getOverdueColor, 
  getOverdueText 
}: {
  review: DueReview;
  index: number;
  isCompleted: boolean;
  onStartReview: (index: number) => void;
  getOverdueColor: (days: number) => string;
  getOverdueText: (days: number) => string;
}) => (
  <Card 
    className={`p-4 transition-all duration-200 hover:shadow-md ${
      isCompleted 
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
        {isCompleted ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            ✓ Reviewed
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStartReview(index)}
          >
            Review
          </Button>
        )}
      </div>
    </div>
  </Card>
);

export default ReviewScheduler;
