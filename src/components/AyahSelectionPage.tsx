
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

const AyahSelectionPage = ({ onAyahSelect, onBack }: AyahSelectionPageProps) => {
  const [selectedSurah, setSelectedSurah] = useState<string>('1');
  const [ayahNumber, setAyahNumber] = useState<string>('1');
  const [maxAyahs, setMaxAyahs] = useState<number>(7);

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
          <div className="space-y-2">
            <Label htmlFor="surah-select" className="text-base font-medium text-slate-700">
              Select Surah
            </Label>
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
