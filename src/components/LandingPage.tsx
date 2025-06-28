import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, BookOpen, Star, ArrowRight, Bell } from 'lucide-react';

interface LandingPageProps {
  onStartMemorizing: () => void;
  dueReviewsCount?: number;
}

const LandingPage = ({ onStartMemorizing, dueReviewsCount = 0 }: LandingPageProps) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md mx-auto space-y-8">
        {/* App Logo/Title */}
        <div className="space-y-4">
          <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 leading-tight">
            One Ayah
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Memorize one ayah a day in 5 minutes.
          </p>
          <p className="text-base text-slate-500 dark:text-slate-500">
            Start where you want. Listen. Repeat. Remember.
          </p>
          
          {user && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}! 🌟
              </p>
            </div>
          )}
        </div>

        {/* Due Reviews Alert */}
        {user && dueReviewsCount > 0 && (
          <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-orange-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  {dueReviewsCount} ayah{dueReviewsCount === 1 ? '' : 's'} due for review
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Review first to strengthen your memory
                </p>
              </div>
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                {dueReviewsCount}
              </Badge>
            </div>
          </Card>
        )}
        
        {/* Main Action Button */}
        <div className="pt-8">
          <Button 
            onClick={onStartMemorizing}
            className="w-full py-4 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {user ? (
              dueReviewsCount > 0 ? (
                <>
                  <Star className="h-5 w-5 mr-2" />
                  Start Review Session
                </>
              ) : (
                <>
                  <BookOpen className="h-5 w-5 mr-2" />
                  Continue Memorizing
                </>
              )
            ) : (
              <>
                <BookOpen className="h-5 w-5 mr-2" />
                Start Memorizing
              </>
            )}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          
          {!user && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
              Sign in to save your progress across devices
            </p>
          )}
        </div>

        {/* Feature Highlights */}
        {user && (
          <div className="grid grid-cols-2 gap-4 pt-6">
            <Card className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-center space-y-2">
                <Calendar className="h-6 w-6 text-emerald-600 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Progress
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track your journey
                </p>
              </div>
            </Card>
            
            <Card className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-center space-y-2">
                <Star className="h-6 w-6 text-yellow-500 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Reviews
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Spaced repetition
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* App Description */}
        <div className="pt-6 space-y-3 text-sm text-slate-500 dark:text-slate-400">
          <p>
            ✨ Beautiful Arabic typography with Amiri font
          </p>
          <p>
            🔄 Smart spaced repetition system
          </p>
          <p>
            📖 Page-aware memorization tracking
          </p>
          <p>
            🎯 Daily habit formation
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;