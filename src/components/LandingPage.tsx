
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface LandingPageProps {
  onStartMemorizing: () => void;
}

const LandingPage = ({ onStartMemorizing }: LandingPageProps) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-slate-800 leading-tight">
            Memorize one ayah a day in 5 minutes.
          </h1>
          <p className="text-lg text-slate-600">
            Start where you want. Listen. Repeat. Remember.
          </p>
          {user && (
            <p className="text-sm text-emerald-600 font-medium">
              Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}!
            </p>
          )}
        </div>
        
        <div className="pt-8">
          <Button 
            onClick={onStartMemorizing}
            className="w-full py-4 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {user ? 'Continue Memorizing' : 'Start Memorizing'}
          </Button>
          
          {!user && (
            <p className="text-sm text-slate-500 mt-3">
              Sign in to save your progress across devices
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
