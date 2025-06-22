
import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import BottomNavbar from './BottomNavbar';

interface ProgressPageProps {
  memorizedAyahs: Array<{ surah: number; ayah: number }>;
  onNavigate: (page: 'landing' | 'selection' | 'memorization' | 'progress') => void;
}

const ProgressPage = ({ memorizedAyahs, onNavigate }: ProgressPageProps) => {
  const surahNames: { [key: number]: string } = {
    1: "Al-Fatihah",
    2: "Al-Baqarah",
    3: "Aal-E-Imran",
    4: "An-Nisa",
    5: "Al-Ma'idah",
    6: "Al-An'am",
    7: "Al-A'raf",
    8: "Al-Anfal",
    9: "At-Tawbah",
    10: "Yunus",
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="flex-1 p-4 pb-20">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center py-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">My Progress</h1>
            <p className="text-lg text-emerald-600 font-semibold">
              Ayahs memorized: {memorizedAyahs.length}
            </p>
          </div>

          {/* Memorized Ayahs Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-700">Memorized Ayahs</h2>
            
            {memorizedAyahs.length === 0 ? (
              <Card className="p-6 bg-white/60 backdrop-blur-sm text-center">
                <p className="text-slate-600">No ayahs memorized yet.</p>
                <p className="text-sm text-slate-500 mt-2">Start your journey today!</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {memorizedAyahs.map((ayah, index) => (
                  <Card key={index} className="p-4 bg-white/80 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={`ayah-${index}`}
                          className="h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <Label htmlFor={`ayah-${index}`} className="text-sm font-medium text-slate-700">
                          {surahNames[ayah.surah] || `Surah ${ayah.surah}`}
                        </Label>
                      </div>
                      <span className="text-sm text-slate-500">
                        Ayah {ayah.ayah}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Card className="p-4 bg-emerald-100 border-emerald-200 text-center">
              <div className="text-2xl font-bold text-emerald-700">{memorizedAyahs.length}</div>
              <div className="text-sm text-emerald-600">Total Ayahs</div>
            </Card>
            <Card className="p-4 bg-blue-100 border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-700">7</div>
              <div className="text-sm text-blue-600">Day Streak</div>
            </Card>
          </div>
        </div>
      </div>

      <BottomNavbar currentPage="progress" onNavigate={onNavigate} />
    </div>
  );
};

export default ProgressPage;
