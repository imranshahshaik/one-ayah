
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import BottomNavbar from './BottomNavbar';
import { ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react';

interface MemorizationPageProps {
  selectedAyah: { surah: number; ayah: number };
  onMarkMemorized: (surah: number, ayah: number) => void;
  onNavigate: (page: 'landing' | 'selection' | 'memorization' | 'progress') => void;
}

const MemorizationPage = ({ selectedAyah, onMarkMemorized, onNavigate }: MemorizationPageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [repeatCount, setRepeatCount] = useState('5');
  const [currentRepeat, setCurrentRepeat] = useState(1);
  const [isMemorized, setIsMemorized] = useState(false);

  // Sample ayah data
  const ayahData = {
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    translation: "Indeed, with hardship comes ease.",
    transliteration: "Inna ma'a al-'usri yusra",
    surahName: "Ash-Sharh"
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMarkMemorized = () => {
    setIsMemorized(true);
    onMarkMemorized(selectedAyah.surah, selectedAyah.ayah);
  };

  const progressPercentage = (currentRepeat / parseInt(repeatCount)) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="flex-1 p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center py-4">
            <h1 className="text-lg font-semibold text-slate-800">
              Surah {ayahData.surahName}, Ayah {selectedAyah.ayah}
            </h1>
          </div>

          {/* Arabic Text */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg">
            <div className="text-center">
              <p className="text-2xl leading-relaxed text-slate-800 font-arabic" dir="rtl">
                {ayahData.arabic}
              </p>
            </div>
          </Card>

          {/* Translation */}
          <Card className="p-4 bg-white/60 backdrop-blur-sm">
            <p className="text-base text-slate-700 text-center italic">
              {ayahData.translation}
            </p>
          </Card>

          {/* Transliteration Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="transliteration" className="text-sm font-medium text-slate-700">
              Transliteration
            </Label>
            <Switch
              id="transliteration"
              checked={showTransliteration}
              onCheckedChange={setShowTransliteration}
            />
          </div>

          {/* Transliteration Text */}
          {showTransliteration && (
            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <p className="text-sm text-emerald-800 text-center">
                {ayahData.transliteration}
              </p>
            </Card>
          )}

          {/* Audio Controls */}
          <Card className="p-4 bg-white/80 backdrop-blur-sm shadow-lg space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePlayPause}
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <div className="flex-1">
                <Select value={repeatCount} onValueChange={setRepeatCount}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="5">5x</SelectItem>
                    <SelectItem value="10">10x</SelectItem>
                    <SelectItem value="20">20x</SelectItem>
                    <SelectItem value="50">50x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Repeating {currentRepeat} of {repeatCount}</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>
          </Card>

          {/* Mark as Memorized */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="memorized"
              checked={isMemorized}
              onChange={handleMarkMemorized}
              className="h-5 w-5 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <Label htmlFor="memorized" className="text-base font-medium text-slate-700">
              Mark as Memorized
            </Label>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            <Button className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700">
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNavbar currentPage="memorization" onNavigate={onNavigate} />
    </div>
  );
};

export default MemorizationPage;
