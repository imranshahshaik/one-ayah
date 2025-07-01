
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgressData } from '@/hooks/useSupabaseData';
import ContinueButton from './enhanced/ContinueButton';
import { Calendar, BookOpen, Star, ArrowRight, Bell, Flame, Trophy, BarChart3, Clock, Target } from 'lucide-react';

interface LandingPageProps {
  onStartMemorizing: () => void;
  onContinue?: (surah: number, ayah: number) => void;
  dueReviewsCount?: number;
  onNavigate?: (page: 'calendar' | 'progress' | 'review' | 'selection') => void;
}

const LandingPage = ({ onStartMemorizing, onContinue, dueReviewsCount = 0, onNavigate }: LandingPageProps) => {
  const { user } = useAuth();
  const { progress } = useUserProgressData();

  const handleContinue = (surah: number, ayah: number) => {
    console.log('Continue button clicked:', { surah, ayah });
    if (onContinue) {
      onContinue(surah, ayah);
    } else {
      onStartMemorizing();
    }
  };

  const handleQuickAction = (action: 'calendar' | 'progress' | 'review') => {
    if (onNavigate) {
      onNavigate(action);
    }
  };

  const hasLastVisited = progress && progress.last_visited_surah && progress.last_visited_ayah;
  const todayGoalMet = progress && progress.total_memorized > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md mx-auto space-y-8">
        {/* App Logo/Title */}
        <div className="space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse">
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
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-4 mt-4 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mb-2">
                Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}! 🌟
              </p>
              {progress && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-center space-x-1 bg-orange-100 dark:bg-orange-900/30 rounded-lg px-2 py-1">
                    <Flame className="h-3 w-3 text-orange-600" />
                    <span className="text-orange-700 dark:text-orange-300 font-medium">
                      {progress.current_streak || 0} day streak
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg px-2 py-1">
                    <Trophy className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                      {progress.total_memorized || 0} memorized
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Today's Goal Status */}
        {user && (
          <Card className={`p-4 ${todayGoalMet 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800'
          } animate-fade-in-up`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${todayGoalMet 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <Target className={`h-5 w-5 ${todayGoalMet 
                  ? 'text-green-600' 
                  : 'text-blue-600'
                }`} />
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${todayGoalMet 
                  ? 'text-green-800 dark:text-green-300' 
                  : 'text-blue-800 dark:text-blue-300'
                }`}>
                  {todayGoalMet ? "Today's goal complete! 🎉" : "Ready for today's ayah?"}
                </p>
                <p className={`text-xs ${todayGoalMet 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {todayGoalMet ? 'Keep the momentum going!' : 'One ayah brings you closer to your goal'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Continue Button for Authenticated Users */}
        {user && hasLastVisited && (
          <ContinueButton 
            onContinue={handleContinue}
            className="animate-fade-in-up"
          />
        )}

        {/* Due Reviews Alert */}
        {user && dueReviewsCount > 0 && (
          <Card 
            className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800 animate-fade-in-up cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleQuickAction('review')}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Bell className="h-5 w-5 text-orange-600 animate-pulse" />
              </div>
              <div className="text-left flex-1">
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
              <ArrowRight className="h-4 w-4 text-orange-600" />
            </div>
          </Card>
        )}
        
        {/* Main Action Button */}
        <div className="pt-4">
          <Button 
            onClick={onStartMemorizing}
            className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            {user ? (
              dueReviewsCount > 0 ? (
                <>
                  <Star className="h-5 w-5 mr-2" />
                  Start Review Session
                </>
              ) : hasLastVisited ? (
                <>
                  <BookOpen className="h-5 w-5 mr-2" />
                  Continue Memorizing
                </>
              ) : (
                <>
                  <BookOpen className="h-5 w-5 mr-2" />
                  Start Memorizing
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

        {/* Quick Actions for Authenticated Users */}
        {user && (
          <div className="grid grid-cols-3 gap-3 pt-4">
            <Card 
              className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer hover:scale-105 transform"
              onClick={() => handleQuickAction('calendar')}
            >
              <div className="text-center space-y-2">
                <Calendar className="h-6 w-6 text-blue-600 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Calendar
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  View journey
                </p>
              </div>
            </Card>
            
            <Card 
              className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer hover:scale-105 transform"
              onClick={() => handleQuickAction('progress')}
            >
              <div className="text-center space-y-2">
                <BarChart3 className="h-6 w-6 text-emerald-600 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Progress
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  See stats
                </p>
              </div>
            </Card>

            <Card 
              className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm hover:shadow-md transition-all cursor-pointer hover:scale-105 transform"
              onClick={() => handleQuickAction('review')}
            >
              <div className="text-center space-y-2">
                <Clock className="h-6 w-6 text-yellow-600 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Reviews
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {dueReviewsCount > 0 ? `${dueReviewsCount} due` : 'All done'}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Motivational Features */}
        {user && progress && (
          <div className="space-y-3 pt-4">
            {progress.current_streak > 0 && (
              <div className="text-center p-3 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  🔥 You're on fire! {progress.current_streak} day streak
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Don't break the chain - memorize today!
                </p>
              </div>
            )}
            
            {progress.total_memorized > 0 && progress.total_memorized % 10 === 0 && (
              <div className="text-center p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                  🏆 Milestone reached! {progress.total_memorized} ayahs memorized
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Amazing progress, keep going!
                </p>
              </div>
            )}
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
            🎯 Daily habit formation with streak tracking
          </p>
          {user && (
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">
              🔐 Your progress is automatically saved
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
