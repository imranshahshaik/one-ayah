
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useUserProgress } from '@/hooks/useUserProgress';
import { User, LogOut, Trophy, Calendar } from 'lucide-react';

interface UserMenuProps {
  onNavigate: (page: 'landing' | 'selection' | 'memorization' | 'progress' | 'settings') => void;
}

const UserMenu = ({ onNavigate }: UserMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { currentStreak, bestStreak, totalMemorized } = useUserProgress();

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2"
      >
        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium">
          {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
        </span>
      </Button>

      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsMenuOpen(false)}
          />
          <Card className="absolute right-0 top-full mt-2 w-64 z-50 shadow-lg">
            <CardContent className="p-4 space-y-4">
              <div className="text-center">
                <p className="font-medium">{user.user_metadata?.full_name || 'User'}</p>
                <p className="text-sm text-slate-600">{user.email}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-emerald-50 rounded">
                  <div className="text-lg font-bold text-emerald-600">{totalMemorized}</div>
                  <div className="text-xs text-emerald-700">Memorized</div>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-600">{currentStreak}</div>
                  <div className="text-xs text-blue-700">Current</div>
                </div>
                <div className="p-2 bg-yellow-50 rounded">
                  <div className="text-lg font-bold text-yellow-600">{bestStreak}</div>
                  <div className="text-xs text-yellow-700">Best</div>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onNavigate('progress');
                    setIsMenuOpen(false);
                  }}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  View Progress
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    onNavigate('settings');
                    setIsMenuOpen(false);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
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
