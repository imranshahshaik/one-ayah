
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, Star } from 'lucide-react';

interface SM2ReviewButtonProps {
  onReviewQuality: (quality: 'easy' | 'good' | 'hard') => void;
  disabled?: boolean;
  className?: string;
}

const SM2ReviewButton = ({ onReviewQuality, disabled = false, className = '' }: SM2ReviewButtonProps) => {
  return (
    <Card className={`p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm ${className}`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            How well did you remember this ayah?
          </h3>
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          This helps us schedule the optimal review time using spaced repetition.
        </p>
        
        <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
          <Button
            onClick={() => onReviewQuality('easy')}
            disabled={disabled}
            className="bg-green-600 hover:bg-green-700 text-white py-3 text-left justify-start"
          >
            <CheckCircle className="h-5 w-5 mr-3" />
            <div>
              <div className="font-medium">Easy</div>
              <div className="text-xs opacity-90">Perfect recall, no hesitation</div>
            </div>
          </Button>
          
          <Button
            onClick={() => onReviewQuality('good')}
            disabled={disabled}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 text-left justify-start"
          >
            <Clock className="h-5 w-5 mr-3" />
            <div>
              <div className="font-medium">Good</div>
              <div className="text-xs opacity-90">Recalled with some effort</div>
            </div>
          </Button>
          
          <Button
            onClick={() => onReviewQuality('hard')}
            disabled={disabled}
            className="bg-red-600 hover:bg-red-700 text-white py-3 text-left justify-start"
          >
            <AlertCircle className="h-5 w-5 mr-3" />
            <div>
              <div className="font-medium">Hard</div>
              <div className="text-xs opacity-90">Struggled to recall, need practice</div>
            </div>
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SM2ReviewButton;
