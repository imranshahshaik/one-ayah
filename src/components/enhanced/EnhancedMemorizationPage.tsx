import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, CheckCircle, Star, Award, Settings } from 'lucide-react';
import StrictAudioPlayer from './StrictAudioPlayer';
import { supabaseService, type UserSettings } from '@/services/SupabaseService';
import { getPageForAyah } from '@/data/mushafPages';
import { useToast } from '@/hooks/use-toast';
import { useAyahData } from '@/hooks/useAyahData';
import { surahs } from '@/data/surahs';

interface EnhancedMemorizationPageProps {
  selectedAyah: { surah: number; ayah: number };
  onMarkMemorized: (surah: number, ayah: number) => void;
  onNavigate: (page: string) => void;
  onAyahChange?: (surah: number, ayah: number) => void;
  debugMode?: boolean;
}

const EnhancedMemorizationPage = ({ 
  selectedAyah, 
  onMarkMemorized, 
  onNavigate, 
  onAyahChange,
  debugMode = false
}: EnhancedMemorizationPageProps) => {
  const [isMemorized, setIsMemorized] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(true);
  
  const { toast } = useToast();
  const { data: ayahData, isLoading: ayahLoading, error } = useAyahData(selectedAyah.surah, selectedAyah.ayah);

  useEffect(() => {
    loadSettings();
    setPageNumber(getPageForAyah(selectedAyah.surah, selectedAyah.ayah));
    setIsMemorized(false); // Reset when ayah changes
  }, [selectedAyah]);

  const debugLog = (message: string, data?: any) => {
    if (debugMode) {
      console.debug(`[EnhancedMemorizationPage] ${message}`, data || '');
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const userSettings = await supabaseService.getUserSettings();
      if (userSettings) {
        setSettings(userSettings);
        setShowTransliteration(userSettings.transliteration_on);
        debugLog('Settings loaded', userSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentSurah = () => surahs.find(s => s.number === selectedAyah.surah);

  const canGoNext = () => {
    const currentSurah = getCurrentSurah();
    if (!currentSurah) return false;
    
    if (selectedAyah.ayah < currentSurah.numberOfAyahs) {
      return true;
    }
    
    return selectedAyah.surah < 114;
  };

  const canGoPrevious = () => {
    if (selectedAyah.ayah > 1) {
      return true;
    }
    
    return selectedAyah.surah > 1;
  };

  const handleNext = () => {
    if (!canGoNext() || !onAyahChange) return;
    
    const currentSurah = getCurrentSurah();
    if (!currentSurah) return;
    
    if (selectedAyah.ayah < currentSurah.numberOfAyahs) {
      onAyahChange(selectedAyah.surah, selectedAyah.ayah + 1);
    } else if (selectedAyah.surah < 114) {
      onAyahChange(selectedAyah.surah + 1, 1);
    }
    
    debugLog('Navigated to next ayah');
  };

  const handlePrevious = () => {
    if (!canGoPrevious() || !onAyahChange) return;
    
    if (selectedAyah.ayah > 1) {
      onAyahChange(selectedAyah.surah, selectedAyah.ayah - 1);
    } else if (selectedAyah.surah > 1) {
      const prevSurah = surahs.find(s => s.number === selectedAyah.surah - 1);
      if (prevSurah) {
        onAyahChange(selectedAyah.surah - 1, prevSurah.numberOfAyahs);
      }
    }
    
    debugLog('Navigated to previous ayah');
  };

  const handleMarkMemorized = async () => {
    try {
      debugLog('Marking ayah as memorized', { surah: selectedAyah.surah, ayah: selectedAyah.ayah });
      
      // Add to database
      await supabaseService.addMemorizedAyah(
        selectedAyah.surah, 
        selectedAyah.ayah, 
        pageNumber
      );

      // Update daily session
      await supabaseService.updateDailySession({
        ayahs_memorized: 1
      });

      // Check for page completion
      const isPageComplete = await supabaseService.checkPageCompletion(pageNumber);
      
      setIsMemorized(true);
      setShowCelebration(true);
      
      // Call parent handler
      onMarkMemorized(selectedAyah.surah, selectedAyah.ayah);

      // Show appropriate toast
      if (isPageComplete) {
        toast({
          title: '🎉 Page Complete!',
          description: `Congratulations! You've completed page ${pageNumber} of the Mushaf.`,
        });
      } else {
        toast({
          title: '✅ Ayah Memorized!',
          description: `Surah ${selectedAyah.surah}, Ayah ${selectedAyah.ayah} has been added to your collection.`,
        });
      }

      // Hide celebration after 3 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 3000);

    } catch (error) {
      console.error('Error marking ayah as memorized:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAudioComplete = () => {
    debugLog('Audio playback completed');
    
    // Auto-mark as memorized if enabled in settings
    if (settings?.auto_play && !isMemorized) {
      handleMarkMemorized();
    }
  };

  const handleSettingsChange = async (newSettings: Partial<UserSettings>) => {
    if (settings) {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Save to database
      await supabaseService.updateUserSettings(updatedSettings);
      debugLog('Settings updated', newSettings);
    }
  };

  const getFontSizeClass = (fontSize: string) => {
    const sizeMap = {
      'small': 'text-xl',
      'medium': 'text-2xl',
      'large': 'text-3xl',
      'extra-large': 'text-4xl'
    };
    return sizeMap[fontSize as keyof typeof sizeMap] || 'text-2xl';
  };

  if (isLoading || ayahLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading ayah...</p>
        </div>
      </div>
    );
  }

  if (error || !ayahData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <Card className="p-6 max-w-md mx-auto text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Failed to Load Ayah
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Could not load Surah {selectedAyah.surah}, Ayah {selectedAyah.ayah}
          </p>
          <Button onClick={() => onNavigate('selection')}>
            Select Different Ayah
          </Button>
        </Card>
      </div>
    );
  }

  const currentSurah = getCurrentSurah();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center animate-bounce">
            <Star className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              Ayah Memorized! 🎉
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Keep up the great work!
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center py-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => onNavigate('landing')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Page {pageNumber}</Badge>
                {isMemorized && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Memorized
                  </Badge>
                )}
              </div>

              <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Surah {currentSurah?.englishName || selectedAyah.surah}, Ayah {selectedAyah.ayah}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {currentSurah?.englishNameTranslation || ''}
            </p>
          </div>

          {/* Debug Info */}
          {debugMode && (
            <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="text-xs font-mono space-y-1">
                <div>Surah: {selectedAyah.surah}, Ayah: {selectedAyah.ayah}</div>
                <div>Page: {pageNumber}</div>
                <div>Memorized: {isMemorized ? 'Yes' : 'No'}</div>
                <div>Settings Loaded: {settings ? 'Yes' : 'No'}</div>
                <div>Audio URL: {ayahData.audio ? 'Available' : 'Not Available'}</div>
              </div>
            </Card>
          )}

          {/* Settings Panel */}
          {showSettings && settings && (
            <Card className="p-4 bg-slate-50 dark:bg-slate-800">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Quick Settings</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="transliteration" className="text-sm font-medium">
                    Show Transliteration
                  </Label>
                  <Switch
                    id="transliteration"
                    checked={showTransliteration}
                    onCheckedChange={(checked) => {
                      setShowTransliteration(checked);
                      handleSettingsChange({ transliteration_on: checked });
                    }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Arabic Text */}
          <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
            <div className="text-center">
              <p 
                className={`${getFontSizeClass(settings?.font_size || 'medium')} leading-relaxed text-slate-800 dark:text-slate-200 font-arabic`} 
                dir="rtl"
                style={{ fontFamily: 'Amiri, "Times New Roman", serif' }}
              >
                {ayahData.text}
              </p>
            </div>
          </Card>

          {/* Translation */}
          {settings?.translation_on !== false && (
            <Card className="p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
              <p className="text-base text-slate-700 dark:text-slate-300 text-center italic leading-relaxed">
                {ayahData.translation || "Translation not available"}
              </p>
            </Card>
          )}

          {/* Transliteration */}
          {showTransliteration && (
            <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-800 dark:text-emerald-300 text-center leading-relaxed">
                {ayahData.transliteration || "Transliteration not available"}
              </p>
            </Card>
          )}

          {/* Audio Player */}
          {ayahData.audio && (
            <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
              <StrictAudioPlayer
                audioUrl={ayahData.audio}
                defaultRepeatCount={settings?.playback_count || 5}
                autoPlay={settings?.auto_play || false}
                onComplete={handleAudioComplete}
                debugMode={debugMode}
              />
            </Card>
          )}

          {/* Mark as Memorized */}
          <Card className="p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="memorized"
                  checked={isMemorized}
                  onChange={handleMarkMemorized}
                  className="h-5 w-5 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <Label htmlFor="memorized" className="text-base font-medium text-slate-700 dark:text-slate-300">
                  Mark as Memorized
                </Label>
              </div>
              
              {isMemorized && (
                <Award className="h-5 w-5 text-emerald-600" />
              )}
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={handlePrevious}
              disabled={!canGoPrevious()}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <Button 
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleNext}
              disabled={!canGoNext()}
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => onNavigate('progress')}
              className="flex items-center justify-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Progress</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onNavigate('review')}
              className="flex items-center justify-center space-x-2"
            >
              <Star className="h-4 w-4" />
              <span>Review</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigate('pages')}
              className="flex items-center justify-center space-x-2"
            >
              <Award className="h-4 w-4" />
              <span>Pages</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMemorizationPage;