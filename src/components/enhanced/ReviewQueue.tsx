import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Calendar, Clock, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { supabaseService, type DueReview } from '@/services/SupabaseService';
import { useAyahData } from '@/hooks/useAyahData';
import { spacedRepetitionService } from '@/services/SpacedRepetitionService';
import EnhancedStrictAudioPlayer from './EnhancedStrictAudioPlayer';
import SM2ReviewButton from './SM2ReviewButton';
import VoiceRecorder from './VoiceRecorder';
import { useToast } from '@/hooks/use-toast';

interface ReviewQueueProps {
  onComplete?: () => void;
  onNavigate?: (page: string) => void;
  showPrompt?: boolean;
  onDismissPrompt?: () => void;
}

const ReviewQueue = ({ onComplete, onNavigate, showPrompt, onDismissPrompt }: ReviewQueueProps) => {
  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState<'queue' | 'review'>('queue');
  const [completedReviews, setCompletedReviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadDueReviews();
  }, []);

  const loadDueReviews = async () => {
    setIsLoading(true);
    try {
      const reviews = await supabaseService.getDueReviews();
      setDueReviews(reviews);
      
      // Auto-start review if there are due reviews and prompt is shown
      if (reviews.length > 0 && showPrompt) {
        setReviewMode('review');
      }
    } catch (error) {
      console.error('Error loading due reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartReview = (index: number = 0) => {
    setCurrentReviewIndex(index);
    setReviewMode('review');
    if (onDismissPrompt) {
      onDismissPrompt();
    }
  };

  const handleReviewQuality = async (quality: 'easy' | 'good' | 'hard') => {
    const currentReview = dueReviews[currentReviewIndex];
    if (!currentReview || isProcessing) return;

    setIsProcessing(true);
    
    try {
      // Update the review using the spaced repetition service
      const success = await supabaseService.updateAyahReview(currentReview.id, quality);
      
      if (success) {
        setCompletedReviews(prev => [...prev, currentReview.id]);
        
        // Show feedback
        const messages = {
          easy: '✨ Easy! Next review in longer interval',
          good: '👍 Good! Standard interval applied',
          hard: '💪 Keep practicing! Shorter interval set'
        };
        
        toast({
          title: 'Review Recorded',
          description: messages[quality],
        });
        
        // Move to next review or complete
        if (currentReviewIndex < dueReviews.length - 1) {
          setCurrentReviewIndex(prev => prev + 1);
        } else {
          // All reviews completed
          setReviewMode('queue');
          if (onComplete) {
            onComplete();
          }
          // Reload to get updated list
          loadDueReviews();
          
          toast({
            title: '🎉 All Reviews Complete!',
            description: 'Great job! Your memory is getting stronger.',
          });
        }
      }
    } catch (error) {
      console.error('Error reviewing ayah:', error);
      toast({
        title: 'Error',
        description: 'Failed to save review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
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

  const getPriorityIcon = (daysOverdue: number) => {
    if (daysOverdue > 3) return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (daysOverdue > 0) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <Star className="h-4 w-4 text-green-600" />;
  };

  // Review Prompt Component
  if (showPrompt && dueReviews.length > 0) {
    return (
      <div className="fixed top-4 left-4 right-4 z-50 animate-slide-in-down">
        <Card className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-300">
                  📚 {dueReviews.length} Review{dueReviews.length === 1 ? '' : 's'} Due!
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Strengthen your memory with spaced repetition
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => handleStartReview(0)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                Review Now
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              {onDismissPrompt && (
                <Button
                  onClick={onDismissPrompt}
                  variant="ghost"
                  size="sm"
                  className="text-orange-600"
                >
                  Later
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

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
      onBack={() => setReviewMode('queue')}
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
                getPriorityIcon={getPriorityIcon}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Separate component for review mode
const ReviewModeContent = ({ 
  currentReview, 
  currentReviewIndex, 
  totalReviews, 
  onReviewQuality, 
  isProcessing,
  onBack
}: {
  currentReview: DueReview;
  currentReviewIndex: number;
  totalReviews: number;
  onReviewQuality: (quality: 'easy' | 'good' | 'hard') => void;
  isProcessing: boolean;
  onBack: () => void;
}) => {
  const { data: ayahData } = useAyahData(currentReview.surah_number, currentReview.ayah_number);

  return (
    <div className="space-y-6">
      {/* Review Header */}
      <div className="text-center">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back to Queue
          </Button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Review Mode
          </h2>
          <div></div>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 mb-2">
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

          {/* Voice Recorder */}
          <VoiceRecorder
            surah={currentReview.surah_number}
            ayah={currentReview.ayah_number}
            originalAudioUrl={ayahData.audio}
          />

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
  getOverdueText,
  getPriorityIcon
}: {
  review: DueReview;
  index: number;
  isCompleted: boolean;
  onStartReview: (index: number) => void;
  getOverdueColor: (days: number) => string;
  getOverdueText: (days: number) => string;
  getPriorityIcon: (days: number) => React.ReactNode;
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
        <div className="flex items-center space-x-2">
          {getPriorityIcon(review.days_overdue)}
          <div className="text-left">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Surah {review.surah_number}, Ayah {review.ayah_number}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Page {review.page_number}
            </p>
          </div>
        </div>
        
        <Badge className={getOverdueColor(review.days_overdue)}>
          {getOverdueText(review.days_overdue)}
        </Badge>
      </div>

      <div className="flex items-center space-x-2">
        {isCompleted ? (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Reviewed
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

export default ReviewQueue;