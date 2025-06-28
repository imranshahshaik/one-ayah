import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { useSurahs } from '@/hooks/useSupabaseData';

interface AyahSelectionPageProps {
  onAyahSelect: (surah: number, ayah: number) => void;
  onBack: () => void;
}

// Small surahs from the 30th Juz (Para) for quick access
const smallSurahs = [
  { number: 78, name: 'An-Naba', ayahs: 40 },
  { number: 79, name: 'An-Naziat', ayahs: 46 },
  { number: 80, name: 'Abasa', ayahs: 42 },
  { number: 81, name: 'At-Takwir', ayahs: 29 },
  { number: 82, name: 'Al-Infitar', ayahs: 19 },
  { number: 83, name: 'Al-Mutaffifin', ayahs: 36 },
  { number: 84, name: 'Al-Inshiqaq', ayahs: 25 },
  { number: 85, name: 'Al-Buruj', ayahs: 22 },
  { number: 86, name: 'At-Tariq', ayahs: 17 },
  { number: 87, name: 'Al-Ala', ayahs: 19 },
  { number: 88, name: 'Al-Ghashiyah', ayahs: 26 },
  { number: 89, name: 'Al-Fajr', ayahs: 30 },
  { number: 90, name: 'Al-Balad', ayahs: 20 },
  { number: 91, name: 'Ash-Shams', ayahs: 15 },
  { number: 92, name: 'Al-Layl', ayahs: 21 },
  { number: 93, name: 'Ad-Duha', ayahs: 11 },
  { number: 94, name: 'Ash-Sharh', ayahs: 8 },
  { number: 95, name: 'At-Tin', ayahs: 8 },
  { number: 96, name: 'Al-Alaq', ayahs: 19 },
  { number: 97, name: 'Al-Qadr', ayahs: 5 },
  { number: 98, name: 'Al-Bayyinah', ayahs: 8 },
  { number: 99, name: 'Az-Zalzalah', ayahs: 8 },
  { number: 100, name: 'Al-Adiyah', ayahs: 11 },
  { number: 101, name: 'Al-Qariah', ayahs: 11 },
  { number: 102, name: 'At-Takathur', ayahs: 8 },
  { number: 103, name: 'Al-Asr', ayahs: 3 },
  { number: 104, name: 'Al-Humazah', ayahs: 9 },
  { number: 105, name: 'Al-Fil', ayahs: 5 },
  { number: 106, name: 'Quraish', ayahs: 4 },
  { number: 107, name: 'Al-Maun', ayahs: 7 },
  { number: 108, name: 'Al-Kawthar', ayahs: 3 },
  { number: 109, name: 'Al-Kafirun', ayahs: 6 },
  { number: 110, name: 'An-Nasr', ayahs: 3 },
  { number: 111, name: 'Al-Masad', ayahs: 5 },
  { number: 112, name: 'Al-Ikhlas', ayahs: 4 },
  { number: 113, name: 'Al-Falaq', ayahs: 5 },
  { number: 114, name: 'An-Nas', ayahs: 6 },
];

const AyahSelectionPage = ({ onAyahSelect, onBack }: AyahSelectionPageProps) => {
  const [selectedSurah, setSelectedSurah] = useState<string>('1');
  const [ayahNumber, setAyahNumber] = useState<string>('1');
  const [maxAyahs, setMaxAyahs] = useState<number>(7);
  const [selectionMode, setSelectionMode] = useState<'all' | 'small'>('all');
  
  const { surahs, loading, error } = useSurahs();

  // Update max ayahs when surah changes
  useEffect(() => {
    let surah;
    if (selectionMode === 'all') {
      surah = surahs.find(s => s.number === parseInt(selectedSurah));
    } else {
      surah = smallSurahs.find(s => s.number === parseInt(selectedSurah));
    }
    
    if (surah) {
      const ayahCount = selectionMode === 'all' ? surah.number_of_ayahs : surah.ayahs;
      setMaxAyahs(ayahCount);
      // Reset ayah number if it exceeds the new surah's ayah count
      if (parseInt(ayahNumber) > ayahCount) {
        setAyahNumber('1');
      }
    }
  }, [selectedSurah, ayahNumber, selectionMode, surahs]);

  const handleGo = () => {
    const surah = parseInt(selectedSurah);
    const ayah = parseInt(ayahNumber);
    if (surah && ayah && ayah <= maxAyahs) {
      onAyahSelect(surah, ayah);
    }
  };

  const handleAyahChange = (value: string) => {
    const ayah = parseInt(value);
    if (ayah <= maxAyahs) {
      setAyahNumber(value);
    }
  };

  const handleModeChange = (mode: 'all' | 'small') => {
    setSelectionMode(mode);
    // Reset to first surah of the selected mode
    if (mode === 'all') {
      setSelectedSurah('1');
    } else {
      setSelectedSurah('78'); // First small surah
    }
    setAyahNumber('1');
  };

  const handleSmallSurahSelect = (surahNumber: string) => {
    setSelectedSurah(surahNumber);
    setAyahNumber('1');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 ml-2">Select Ayah</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading surahs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 ml-2">Select Ayah</h1>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <Card className="p-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-red-600 mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Database Connection Issue
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {error}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                Please check your Supabase connection and ensure the database migration has been run.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
      <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 ml-2">Select Ayah</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Selection Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => handleModeChange('all')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectionMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All Surahs
            </button>
            <button
              onClick={() => handleModeChange('small')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectionMode === 'small'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Small Surahs
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="surah-select" className="text-base font-medium text-slate-700 dark:text-slate-300">
              {selectionMode === 'small' ? 'Select Small Surah (30th Juz)' : 'Select Surah'}
            </Label>
            {selectionMode === 'all' ? (
              <Select value={selectedSurah} onValueChange={setSelectedSurah}>
                <SelectTrigger className="w-full h-12 text-left">
                  <SelectValue placeholder="Choose a Surah" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {surahs.map((surah) => (
                    <SelectItem key={surah.number} value={surah.number.toString()}>
                      {surah.number}. {surah.english_name} ({surah.number_of_ayahs} ayahs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={selectedSurah} onValueChange={handleSmallSurahSelect}>
                <SelectTrigger className="w-full h-12 text-left">
                  <SelectValue placeholder="Choose a Small Surah" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {smallSurahs.map((surah) => (
                    <SelectItem key={surah.number} value={surah.number.toString()}>
                      {surah.number}. {surah.name} ({surah.ayahs} ayahs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ayah-input" className="text-base font-medium text-slate-700 dark:text-slate-300">
              Starting Ayah Number (1-{maxAyahs})
            </Label>
            <Input
              id="ayah-input"
              type="number"
              min="1"
              max={maxAyahs}
              value={ayahNumber}
              onChange={(e) => handleAyahChange(e.target.value)}
              className="w-full h-12 text-center text-lg"
              placeholder="1"
            />
          </div>

          <Button 
            onClick={handleGo}
            disabled={parseInt(ayahNumber) > maxAyahs || parseInt(ayahNumber) < 1}
            className="w-full py-4 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Start Memorizing
          </Button>

          {/* Quick Access */}
          <div className="pt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-3">
              Quick Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSurah('1');
                  setAyahNumber('1');
                  setSelectionMode('all');
                }}
                className="text-xs"
              >
                Al-Fatihah
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSurah('112');
                  setAyahNumber('1');
                  setSelectionMode('small');
                }}
                className="text-xs"
              >
                Al-Ikhlas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AyahSelectionPage;