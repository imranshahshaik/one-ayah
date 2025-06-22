
import { useQuery } from '@tanstack/react-query';

interface AyahData {
  number: number;
  audio: string;
  audioSecondary: string[];
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
  };
  numberInSurah: number;
}

interface ApiResponse {
  code: number;
  status: string;
  data: AyahData;
}

const fetchAyahData = async (surah: number, ayah: number): Promise<AyahData> => {
  const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.alafasy`);
  if (!response.ok) {
    throw new Error('Failed to fetch ayah data');
  }
  const result: ApiResponse = await response.json();
  return result.data;
};

export const useAyahData = (surah: number, ayah: number) => {
  return useQuery({
    queryKey: ['ayah', surah, ayah],
    queryFn: () => fetchAyahData(surah, ayah),
    enabled: Boolean(surah && ayah),
  });
};
