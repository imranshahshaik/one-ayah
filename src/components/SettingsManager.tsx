import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Volume2, Bell, Type, Palette, Save } from 'lucide-react';
import { supabaseService, type UserSettings } from '@/services/SupabaseService';
import { useToast } from '@/hooks/use-toast';

interface SettingsManagerProps {
  onSettingsChange?: (settings: Partial<UserSettings>) => void;
}

const SettingsManager = ({ onSettingsChange }: SettingsManagerProps) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const userSettings = await supabaseService.getUserSettings();
      if (userSettings) {
        setSettings(userSettings);
        applySettings(userSettings);
      } else {
        // Create default settings
        const defaultSettings: Partial<UserSettings> = {
          playback_count: 5,
          dark_mode: false,
          font_size: 'medium',
          translation_on: true,
          transliteration_on: true,
          auto_play: true,
          notifications_enabled: true,
          notification_time: '08:00:00'
        };
        setSettings(defaultSettings as UserSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applySettings = (userSettings: UserSettings) => {
    // Apply dark mode
    if (userSettings.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Store in localStorage for persistence
    localStorage.setItem('darkMode', userSettings.dark_mode.toString());
    localStorage.setItem('fontSize', userSettings.font_size);
    localStorage.setItem('autoPlay', userSettings.auto_play.toString());
    localStorage.setItem('transliterationOn', userSettings.transliteration_on.toString());
    localStorage.setItem('translationOn', userSettings.translation_on.toString());
    localStorage.setItem('playbackCount', userSettings.playback_count.toString());
  };

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    // Apply immediately for UI settings
    if (key === 'dark_mode') {
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', value.toString());
    }

    // Notify parent component
    if (onSettingsChange) {
      onSettingsChange(updatedSettings);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const success = await supabaseService.updateUserSettings(settings);
      
      if (success) {
        applySettings(settings);
        toast({
          title: 'Settings Saved',
          description: 'Your preferences have been updated successfully.',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = async () => {
    const defaultSettings: Partial<UserSettings> = {
      playback_count: 5,
      dark_mode: false,
      font_size: 'medium',
      translation_on: true,
      transliteration_on: true,
      auto_play: true,
      notifications_enabled: true,
      notification_time: '08:00:00'
    };

    setSettings(defaultSettings as UserSettings);
    
    // Clear localStorage
    localStorage.removeItem('darkMode');
    localStorage.removeItem('fontSize');
    localStorage.removeItem('autoPlay');
    localStorage.removeItem('transliterationOn');
    localStorage.removeItem('translationOn');
    localStorage.removeItem('playbackCount');

    // Apply default settings
    document.documentElement.classList.remove('dark');

    toast({
      title: 'Settings Reset',
      description: 'All settings have been reset to defaults.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Failed to load settings</p>
        <Button onClick={loadSettings}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Appearance Settings */}
      <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
          <Palette className="h-5 w-5 mr-2" />
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
              checked={settings.dark_mode}
              onCheckedChange={(value) => updateSetting('dark_mode', value)}
            />
          </div>

          <Separator className="dark:bg-slate-700" />

          <div className="space-y-2">
            <Label className="text-base font-medium text-slate-700 dark:text-slate-300 flex items-center">
              <Type className="h-4 w-4 mr-2" />
              Arabic Text Size
            </Label>
            <Select 
              value={settings.font_size} 
              onValueChange={(value) => updateSetting('font_size', value)}
            >
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
      <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
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
              checked={settings.auto_play}
              onCheckedChange={(value) => updateSetting('auto_play', value)}
            />
          </div>

          <Separator className="dark:bg-slate-700" />

          <div className="space-y-2">
            <Label className="text-base font-medium text-slate-700 dark:text-slate-300">
              Default Repeat Count
            </Label>
            <Select 
              value={settings.playback_count.toString()} 
              onValueChange={(value) => updateSetting('playback_count', parseInt(value))}
            >
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
      <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
          Reading Preferences
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="translation" className="text-base font-medium text-slate-700 dark:text-slate-300">
                Show Translation
              </Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Display English translation by default
              </p>
            </div>
            <Switch
              id="translation"
              checked={settings.translation_on}
              onCheckedChange={(value) => updateSetting('translation_on', value)}
            />
          </div>

          <Separator className="dark:bg-slate-700" />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="transliteration" className="text-base font-medium text-slate-700 dark:text-slate-300">
                Show Transliteration
              </Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Display transliteration by default
              </p>
            </div>
            <Switch
              id="transliteration"
              checked={settings.transliteration_on}
              onCheckedChange={(value) => updateSetting('transliteration_on', value)}
            />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notifications
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications" className="text-base font-medium text-slate-700 dark:text-slate-300">
                Daily Reminders
              </Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Get reminded to memorize daily
              </p>
            </div>
            <Switch
              id="notifications"
              checked={settings.notifications_enabled}
              onCheckedChange={(value) => updateSetting('notifications_enabled', value)}
            />
          </div>

          {settings.notifications_enabled && (
            <>
              <Separator className="dark:bg-slate-700" />
              
              <div className="space-y-2">
                <Label className="text-base font-medium text-slate-700 dark:text-slate-300">
                  Reminder Time
                </Label>
                <Input
                  type="time"
                  value={settings.notification_time}
                  onChange={(e) => updateSetting('notification_time', e.target.value)}
                  className="w-full"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
        
        <Button
          onClick={resetSettings}
          variant="outline"
          className="flex-1"
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
};

export default SettingsManager;