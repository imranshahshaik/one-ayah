
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { surahs } from '../data/surahs';

interface AyahSelectionPageProps {
  onAyahSelect: (surah: number, ayah: number) => void;
  onBack: () => void;
}

// Small surahs from the 30th Juz (Para)
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

  // Update max ayahs when surah changes
  useEffect(() => {
    const surah = surahs.find(s => s.number === parseInt(selectedSurah));
    if (surah) {
      setMaxAyahs(surah.numberOfAyahs);
      // Reset ayah number if it exceeds the new surah's ayah count
      if (parseInt(ayahNumber) > surah.numberOfAyahs) {
        setAyahNumber('1');
      }
    }
  }, [selectedSurah, ayahNumber]);

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

  const handleSmallSurahSelect = (surahNumber: string) => {
    setSelectedSurah(surahNumber);
    setAyahNumber('1');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center p-4 border-b border-slate-200">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold text-slate-800 ml-2">Select Ayah</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Selection Mode Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setSelectionMode('all')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectionMode === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Surahs
            </button>
            <button
              onClick={() => setSelectionMode('small')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectionMode === 'small'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Small Surahs
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="surah-select" className="text-base font-medium text-slate-700">
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
                      {surah.number}. {surah.englishName} ({surah.numberOfAyahs} ayahs)
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
            <Label htmlFor="ayah-input" className="text-base font-medium text-slate-700">
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
            Go
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AyahSelectionPage;
