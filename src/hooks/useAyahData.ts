
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

interface TranslationData {
  text: string;
}

interface TransliterationData {
  text: string;
}

interface ApiResponse {
  code: number;
  status: string;
  data: AyahData;
}

interface TranslationResponse {
  code: number;
  status: string;
  data: TranslationData;
}

interface TransliterationResponse {
  code: number;
  status: string;
  data: TransliterationData;
}

interface CombinedAyahData extends AyahData {
  translation?: string;
  transliteration?: string;
}

const fetchAyahData = async (surah: number, ayah: number): Promise<AyahData> => {
  const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.alafasy`);
  if (!response.ok) {
    throw new Error('Failed to fetch ayah data');
  }
  const result: ApiResponse = await response.json();
  return result.data;
};

const fetchTranslation = async (surah: number, ayah: number): Promise<string> => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.sahih`);
    if (!response.ok) {
      throw new Error('Failed to fetch translation');
    }
    const result: TranslationResponse = await response.json();
    return result.data.text;
  } catch (error) {
    console.error('Translation fetch failed:', error);
    return 'Translation not available';
  }
};

const fetchTransliteration = async (surah: number, ayah: number): Promise<string> => {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.transliteration`);
    if (!response.ok) {
      throw new Error('Failed to fetch transliteration');
    }
    const result: TransliterationResponse = await response.json();
    return result.data.text;
  } catch (error) {
    console.error('Transliteration fetch failed:', error);
    return 'Transliteration not available';
  }
};

const fetchCombinedAyahData = async (surah: number, ayah: number): Promise<CombinedAyahData> => {
  const [ayahData, translation, transliteration] = await Promise.all([
    fetchAyahData(surah, ayah),
    fetchTranslation(surah, ayah),
    fetchTransliteration(surah, ayah),
  ]);

  return {
    ...ayahData,
    translation,
    transliteration,
  };
};

export const useAyahData = (surah: number, ayah: number) => {
  return useQuery({
    queryKey: ['ayah', surah, ayah],
    queryFn: () => fetchCombinedAyahData(surah, ayah),
    enabled: Boolean(surah && ayah),
  });
};
