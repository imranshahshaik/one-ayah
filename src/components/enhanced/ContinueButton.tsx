import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { useUserProgressData } from '@/hooks/useSupabaseData';

interface ContinueButtonProps {
  onContinue: (surah: number, ayah: number) => void;
  className?: string;
}

const ContinueButton = ({ onContinue, className }: ContinueButtonProps) => {
  const { progress, loading } = useUserProgressData();

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-slate-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!progress || !progress.last_ayah) {
    return null;
  }

  const handleContinue = () => {
    onContinue(progress.last_surah, progress.last_ayah_number);
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
  };

  return (
    <Card className={`p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            <span className="font-medium text-emerald-800 dark:text-emerald-300">
              Continue where you left off
            </span>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            Surah {progress.last_surah}:{progress.last_ayah_number}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-emerald-700 dark:text-emerald-400">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Last updated {formatLastUpdated(progress.last_updated)}</span>
            </div>
            <div className="mt-1">
              {progress.total_memorized} ayah{progress.total_memorized === 1 ? '' : 's'} memorized
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            size="sm"
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ContinueButton;