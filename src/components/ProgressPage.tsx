
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Calendar, Star, Trophy, Flame, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgressData, useMemorizedAyahs } from '@/hooks/useSupabaseData';
import { surahs } from '@/data/surahs';

interface ProgressPageProps {
  memorizedAyahs: Array<{ surah: number; ayah: number }>;
  onNavigate: (page: 'landing' | 'selection' | 'memorization' | 'progress' | 'settings') => void;
}

type ViewMode = 'overview' | 'memorized' | 'calendar' | 'reviews';

const ProgressPage = ({ memorizedAyahs, onNavigate }: ProgressPageProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const { user } = useAuth();
  const { progress, loading: progressLoading } = useUserProgressData();
  const { memorizedAyahs: dbMemorizedAyahs, loading: memorizedLoading } = useMemorizedAyahs();

  const getSurahName = (surahNumber: number) => {
    const surah = surahs.find(s => s.number === surahNumber);
    return surah ? surah.englishName : `Surah ${surahNumber}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Progress Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <div className="text-center">
            <Trophy className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
              {progress?.total_memorized || 0}
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Ayahs Memorized
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <div className="text-center">
            <Flame className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-800 dark:text-orange-300">
              {progress?.current_streak || 0}
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Day Streak
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="p-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Quick Stats
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Best Streak:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {progress?.best_streak || 0} days
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Pages Completed:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {progress?.pages_completed || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Last Memorized:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {progress?.last_memorized_date 
                ? formatDate(progress.last_memorized_date) 
                : 'Never'
              }
            </span>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => setViewMode('memorized')}
          className="h-16 flex flex-col items-center justify-center space-y-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-sm">My Memorized Ayahs</span>
        </Button>

        <Button
          onClick={() => setViewMode('reviews')}
          variant="outline"
          className="h-16 flex flex-col items-center justify-center space-y-2"
        >
          <Star className="h-5 w-5" />
          <span className="text-sm">Reviews Due</span>
        </Button>
      </div>
    </div>
  );

  const renderMemorizedAyahs = () => {
    const ayahsToShow = user ? dbMemorizedAyahs : memorizedAyahs;

    if (ayahsToShow.length === 0) {
      return (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No Ayahs Memorized Yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Start memorizing ayahs to see them here.
          </p>
          <Button onClick={() => onNavigate('selection')}>
            Start Memorizing
          </Button>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">
            Memorized Ayahs ({ayahsToShow.length})
          </h3>
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {ayahsToShow.length} total
          </Badge>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {ayahsToShow.map((ayah, index) => {
            const surahNumber = user ? ayah.surah_number : ayah.surah;
            const ayahNumber = user ? ayah.ayah_number : ayah.ayah;
            const memorizedDate = user ? ayah.memorized_at : null;
            
            return (
              <Card key={`${surahNumber}-${ayahNumber}-${index}`} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {getSurahName(surahNumber)}, Ayah {ayahNumber}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Surah {surahNumber}:{ayahNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      <Trophy className="h-3 w-3 mr-1" />
                      Memorized
                    </Badge>
                    {memorizedDate && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(memorizedDate)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderReviews = () => (
    <Card className="p-8 text-center">
      <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
        Reviews Coming Soon
      </h3>
      <p className="text-slate-500 dark:text-slate-400">
        The spaced repetition review system will be available soon.
      </p>
    </Card>
  );

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'memorized':
        return renderMemorizedAyahs();
      case 'reviews':
        return renderReviews();
      default:
        return renderOverview();
    }
  };

  if (progressLoading || memorizedLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('landing')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 ml-2">Progress</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading progress...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
      <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('landing')} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 ml-2">Progress</h1>
      </div>

      <div className="flex-1 p-4">
        <div className="max-w-md mx-auto">
          {/* View Mode Toggle */}
          {viewMode !== 'overview' && (
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => setViewMode('overview')}
                className="text-emerald-600 hover:text-emerald-700"
              >
                ← Back to Overview
              </Button>
            </div>
          )}

          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
