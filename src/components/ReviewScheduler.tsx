import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { supabaseService, type DueReview } from '@/services/SupabaseService';
import { useAyahData } from '@/hooks/useAyahData';
import MemorizationPlayer from './MemorizationPlayer';

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
    if (!currentReview) return;

    try {
      await supabaseService.updateAyahReview(currentReview.id, quality);
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
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const getOverdueColor = (daysOverdue: number) => {
    if (daysOverdue === 0) return 'bg-green-100 text-green-800';
    if (daysOverdue <= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
            Review Mode
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

        {/* Memorization Player */}
        <MemorizationPlayer
          surah={currentReview.surah_number}
          ayah={currentReview.ayah_number}
          settings={{
            playbackCount: 3,
            showTransliteration: true,
            fontSize: 'medium',
            autoPlay: false
          }}
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
              </Button>
              
              <Button
                onClick={() => handleReviewQuality('good')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                <Clock className="h-5 w-5 mr-2" />
                Good - Recalled with effort
              </Button>
              
              <Button
                onClick={() => handleReviewQuality('hard')}
                className="bg-red-600 hover:bg-red-700 text-white py-3"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                Hard - Struggled to recall
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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Review Schedule
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {dueReviews.length === 0 
            ? "No reviews due today! Great job staying on track." 
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
            You've completed all your reviews for today. Time to memorize something new!
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
              Start Review Session
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

export default ReviewScheduler;