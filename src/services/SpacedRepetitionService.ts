export interface SRSSchedule {
  intervals: number[]; // Days
  name: string;
}

export const SRS_SCHEDULES: Record<string, SRSSchedule> = {
  IIMK: {
    name: 'IIMK Method',
    intervals: [3, 7, 15, 30, 60, 120, 240] // Days
  },
  ANKI: {
    name: 'Anki Style',
    intervals: [1, 4, 10, 25, 60, 150] // Days
  },
  CUSTOM: {
    name: 'Custom',
    intervals: [1, 3, 7, 14, 30, 90] // Days
  }
};

export interface ReviewResult {
  quality: 'hard' | 'good' | 'easy';
  nextReviewDate: Date;
  intervalDays: number;
  easeFactor: number;
}

class SpacedRepetitionService {
  private schedule: SRSSchedule;

  constructor(scheduleType: keyof typeof SRS_SCHEDULES = 'IIMK') {
    this.schedule = SRS_SCHEDULES[scheduleType];
  }

  calculateNextReview(
    currentInterval: number,
    reviewCount: number,
    quality: 'hard' | 'good' | 'easy',
    easeFactor: number = 2.5
  ): ReviewResult {
    console.debug('[SRS] Calculating next review:', {
      currentInterval,
      reviewCount,
      quality,
      easeFactor
    });

    let newEaseFactor = easeFactor;
    let intervalIndex = Math.min(reviewCount, this.schedule.intervals.length - 1);
    let nextInterval: number;

    // Adjust based on quality
    switch (quality) {
      case 'hard':
        // Reset to beginning or previous interval
        intervalIndex = Math.max(0, intervalIndex - 1);
        newEaseFactor = Math.max(1.3, easeFactor - 0.2);
        nextInterval = this.schedule.intervals[intervalIndex];
        break;
        
      case 'good':
        // Use current interval from schedule
        nextInterval = this.schedule.intervals[intervalIndex];
        break;
        
      case 'easy':
        // Skip ahead or use longer interval
        intervalIndex = Math.min(this.schedule.intervals.length - 1, intervalIndex + 1);
        newEaseFactor = Math.min(3.0, easeFactor + 0.15);
        nextInterval = this.schedule.intervals[intervalIndex];
        break;
    }

    // Apply ease factor for more advanced reviews
    if (reviewCount > 2) {
      nextInterval = Math.round(nextInterval * newEaseFactor);
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

    const result: ReviewResult = {
      quality,
      nextReviewDate,
      intervalDays: nextInterval,
      easeFactor: newEaseFactor
    };

    console.debug('[SRS] Next review calculated:', result);
    return result;
  }

  getScheduleInfo(): SRSSchedule {
    return this.schedule;
  }

  setSchedule(scheduleType: keyof typeof SRS_SCHEDULES): void {
    this.schedule = SRS_SCHEDULES[scheduleType];
  }

  // Get days until next review milestone
  getDaysUntilMilestone(reviewCount: number): number {
    const nextIndex = Math.min(reviewCount, this.schedule.intervals.length - 1);
    return this.schedule.intervals[nextIndex];
  }

  // Check if ayah is due for review
  isDueForReview(nextReviewDate: string): boolean {
    const reviewDate = new Date(nextReviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    reviewDate.setHours(0, 0, 0, 0);
    
    return reviewDate <= today;
  }

  // Get days overdue
  getDaysOverdue(nextReviewDate: string): number {
    const reviewDate = new Date(nextReviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    reviewDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - reviewDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();