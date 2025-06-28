/**
 * Mushaf page mappings for 20-line Mushaf
 * This maps each ayah to its corresponding page number
 */

export interface PageMapping {
  page: number;
  surah: number;
  startAyah: number;
  endAyah: number;
}

export interface AyahLocation {
  surah: number;
  ayah: number;
  page: number;
  line?: number;
}

// Sample page mappings for the first few pages
// In production, this would be a complete mapping of all 604 pages
export const mushafPages: PageMapping[] = [
  // Page 1
  { page: 1, surah: 1, startAyah: 1, endAyah: 7 },
  
  // Page 2
  { page: 2, surah: 2, startAyah: 1, endAyah: 5 },
  
  // Page 3
  { page: 3, surah: 2, startAyah: 6, endAyah: 16 },
  
  // Page 4
  { page: 4, surah: 2, startAyah: 17, endAyah: 24 },
  
  // Page 5
  { page: 5, surah: 2, startAyah: 25, endAyah: 39 },
  
  // Add more pages as needed...
];

/**
 * Get the page number for a specific ayah
 */
export const getPageForAyah = (surah: number, ayah: number): number => {
  // Simple calculation for demo - in production use complete mapping
  if (surah === 1) return 1;
  if (surah === 2 && ayah <= 5) return 2;
  if (surah === 2 && ayah <= 16) return 3;
  if (surah === 2 && ayah <= 24) return 4;
  if (surah === 2 && ayah <= 39) return 5;
  
  // Default calculation for other ayahs
  // This is a rough approximation - replace with actual data
  return Math.floor((surah - 1) * 10 + ayah / 15) + 1;
};

/**
 * Get all ayahs on a specific page
 */
export const getAyahsOnPage = (pageNumber: number): AyahLocation[] => {
  const pageMapping = mushafPages.find(p => p.page === pageNumber);
  
  if (!pageMapping) {
    // Return empty array for unmapped pages
    return [];
  }
  
  const ayahs: AyahLocation[] = [];
  for (let ayah = pageMapping.startAyah; ayah <= pageMapping.endAyah; ayah++) {
    ayahs.push({
      surah: pageMapping.surah,
      ayah,
      page: pageNumber
    });
  }
  
  return ayahs;
};

/**
 * Get the total number of ayahs on a page
 */
export const getAyahCountOnPage = (pageNumber: number): number => {
  const ayahs = getAyahsOnPage(pageNumber);
  return ayahs.length;
};

/**
 * Check if a page spans multiple surahs
 */
export const isMultiSurahPage = (pageNumber: number): boolean => {
  const ayahs = getAyahsOnPage(pageNumber);
  const uniqueSurahs = new Set(ayahs.map(a => a.surah));
  return uniqueSurahs.size > 1;
};