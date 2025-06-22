
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';

interface AyahSelectionPageProps {
  onAyahSelect: (surah: number, ayah: number) => void;
  onBack: () => void;
}

const AyahSelectionPage = ({ onAyahSelect, onBack }: AyahSelectionPageProps) => {
  const [selectedSurah, setSelectedSurah] = useState<string>('1');
  const [ayahNumber, setAyahNumber] = useState<string>('1');

  const handleGo = () => {
    const surah = parseInt(selectedSurah);
    const ayah = parseInt(ayahNumber);
    if (surah && ayah) {
      onAyahSelect(surah, ayah);
    }
  };

  // Sample surah names (first 10 for demo)
  const surahs = [
    { number: 1, name: "Al-Fatihah" },
    { number: 2, name: "Al-Baqarah" },
    { number: 3, name: "Aal-E-Imran" },
    { number: 4, name: "An-Nisa" },
    { number: 5, name: "Al-Ma'idah" },
    { number: 6, name: "Al-An'am" },
    { number: 7, name: "Al-A'raf" },
    { number: 8, name: "Al-Anfal" },
    { number: 9, name: "At-Tawbah" },
    { number: 10, name: "Yunus" },
  ];

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
              <SelectContent>
                {surahs.map((surah) => (
                  <SelectItem key={surah.number} value={surah.number.toString()}>
                    {surah.number}. {surah.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ayah-input" className="text-base font-medium text-slate-700">
              Starting Ayah Number
            </Label>
            <Input
              id="ayah-input"
              type="number"
              min="1"
              value={ayahNumber}
              onChange={(e) => setAyahNumber(e.target.value)}
              className="w-full h-12 text-center text-lg"
              placeholder="1"
            />
          </div>

          <Button 
            onClick={handleGo}
            className="w-full py-4 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Go
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AyahSelectionPage;
