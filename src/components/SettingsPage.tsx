
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import BottomNavbar from './BottomNavbar';
import { ArrowLeft, Moon, Sun, Volume2, Settings as SettingsIcon } from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (page: 'landing' | 'selection' | 'memorization' | 'progress') => void;
}

const SettingsPage = ({ onNavigate }: SettingsPageProps) => {
  const [darkMode, setDarkMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [defaultRepeatCount, setDefaultRepeatCount] = useState('5');
  const [fontSize, setFontSize] = useState('medium');
  const [showTransliterationDefault, setShowTransliterationDefault] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedAutoPlay = localStorage.getItem('autoPlay') !== 'false'; // default true
    const savedRepeatCount = localStorage.getItem('defaultRepeatCount') || '5';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    const savedTransliteration = localStorage.getItem('showTransliterationDefault') === 'true';

    setDarkMode(savedDarkMode);
    setAutoPlay(savedAutoPlay);
    setDefaultRepeatCount(savedRepeatCount);
    setFontSize(savedFontSize);
    setShowTransliterationDefault(savedTransliteration);

    // Apply dark mode to document
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('darkMode', enabled.toString());
    
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleAutoPlayToggle = (enabled: boolean) => {
    setAutoPlay(enabled);
    localStorage.setItem('autoPlay', enabled.toString());
  };

  const handleRepeatCountChange = (value: string) => {
    setDefaultRepeatCount(value);
    localStorage.setItem('defaultRepeatCount', value);
  };

  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    localStorage.setItem('fontSize', value);
  };

  const handleTransliterationToggle = (enabled: boolean) => {
    setShowTransliterationDefault(enabled);
    localStorage.setItem('showTransliterationDefault', enabled.toString());
  };

  const resetSettings = () => {
    localStorage.removeItem('darkMode');
    localStorage.removeItem('autoPlay');
    localStorage.removeItem('defaultRepeatCount');
    localStorage.removeItem('fontSize');
    localStorage.removeItem('showTransliterationDefault');
    
    setDarkMode(false);
    setAutoPlay(true);
    setDefaultRepeatCount('5');
    setFontSize('medium');
    setShowTransliterationDefault(false);
    
    document.documentElement.classList.remove('dark');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
      <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('landing')} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <SettingsIcon className="h-5 w-5 ml-2 mr-2" />
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Settings</h1>
      </div>

      <div className="flex-1 p-4 pb-20 space-y-6">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Appearance Settings */}
          <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
              <Moon className="h-5 w-5 mr-2" />
              Appearance
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="text-base font-medium text-slate-700 dark:text-slate-300">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Toggle between light and dark theme
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={handleDarkModeToggle}
                />
              </div>

              <Separator className="dark:bg-slate-700" />

              <div className="space-y-2">
                <Label className="text-base font-medium text-slate-700 dark:text-slate-300">
                  Arabic Text Size
                </Label>
                <Select value={fontSize} onValueChange={handleFontSizeChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Audio Settings */}
          <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
              <Volume2 className="h-5 w-5 mr-2" />
              Audio Settings
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-play" className="text-base font-medium text-slate-700 dark:text-slate-300">
                    Auto Play Audio
                  </Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Automatically play audio when ayah loads
                  </p>
                </div>
                <Switch
                  id="auto-play"
                  checked={autoPlay}
                  onCheckedChange={handleAutoPlayToggle}
                />
              </div>

              <Separator className="dark:bg-slate-700" />

              <div className="space-y-2">
                <Label className="text-base font-medium text-slate-700 dark:text-slate-300">
                  Default Repeat Count
                </Label>
                <Select value={defaultRepeatCount} onValueChange={handleRepeatCountChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                    <SelectItem value="5">5x</SelectItem>
                    <SelectItem value="10">10x</SelectItem>
                    <SelectItem value="20">20x</SelectItem>
                    <SelectItem value="50">50x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Reading Settings */}
          <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Reading Settings
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="transliteration-default" className="text-base font-medium text-slate-700 dark:text-slate-300">
                    Show Transliteration by Default
                  </Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Display transliteration when ayah loads
                  </p>
                </div>
                <Switch
                  id="transliteration-default"
                  checked={showTransliterationDefault}
                  onCheckedChange={handleTransliterationToggle}
                />
              </div>
            </div>
          </Card>

          {/* Reset Settings */}
          <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Reset
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Reset all settings to their default values
            </p>
            <Button 
              onClick={resetSettings}
              variant="destructive"
              className="w-full"
            >
              Reset All Settings
            </Button>
          </Card>

        </div>
      </div>

      <BottomNavbar currentPage="settings" onNavigate={onNavigate} />
    </div>
  );
};

export default SettingsPage;
