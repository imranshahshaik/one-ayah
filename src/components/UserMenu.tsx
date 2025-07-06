import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabaseService } from '@/services/SupabaseService';
import { User, LogOut, Trophy, Calendar, Star, BookOpen, Settings, Bell, BarChart3, Target } from 'lucide-react';

interface UserMenuProps {
  onNavigate: (page: string) => void;
  dueReviewsCount?: number;
}

const UserMenu = ({ onNavigate, dueReviewsCount = 0 }: UserMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalMemorized: 0,
    currentStreak: 0,
    bestStreak: 0,
    pagesCompleted: 0,
    dueReviews: 0
  });
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user && isMenuOpen) {
      loadStats();
    }
  }, [user, isMenuOpen]);

  const loadStats = async () => {
    try {
      const progressStats = await supabaseService.getProgressStats();
      setStats(progressStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
      >
        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium">
          {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
        </span>
        {dueReviewsCount > 0 && (
          <Badge className="bg-orange-100 text-orange-800 text-xs">
            {dueReviewsCount}
          </Badge>
        )}
      </Button>

      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsMenuOpen(false)}
          />
          <Card className="absolute right-0 top-full mt-2 w-80 z-50 shadow-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
            <CardContent className="p-6 space-y-6">
              {/* User Info */}
              <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-4">
                <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-white" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {user.email}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.totalMemorized}
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-300">
                    Memorized
                  </div>
                </div>
                
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.currentStreak}
                  </div>
                  <div className="text-xs text-orange-700 dark:text-orange-300">
                    Day Streak
                  </div>
                </div>
                
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.pagesCompleted}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Pages Done
                  </div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.bestStreak}
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300">
                    Best Streak
                  </div>
                </div>
              </div>

              {/* Due Reviews Alert */}
              {dueReviewsCount > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                      {dueReviewsCount} review{dueReviewsCount === 1 ? '' : 's'} due
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Menu */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigate('progress')}
                >
                  <Trophy className="w-4 h-4 mr-3" />
                  Progress & Stats
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigate('calendar')}
                >
                  <Calendar className="w-4 h-4 mr-3" />
                  Calendar View
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigate('review')}
                >
                  <Star className="w-4 h-4 mr-3" />
                  Review Schedule
                  {dueReviewsCount > 0 && (
                    <Badge className="ml-auto bg-orange-100 text-orange-800 text-xs">
                      {dueReviewsCount}
                    </Badge>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigate('pages')}
                >
                  <BookOpen className="w-4 h-4 mr-3" />
                  Page Progress
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigate('habit')}
                >
                  <Target className="w-4 h-4 mr-3" />
                  Habit Tracker
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigate('settings')}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Button>
              </div>

              {/* Sign Out */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default UserMenu;