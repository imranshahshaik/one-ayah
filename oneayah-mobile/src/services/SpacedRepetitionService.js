export const SRS_SCHEDULES = {
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

class SpacedRepetitionService {
  constructor(scheduleType = 'IIMK') {
    this.schedule = SRS_SCHEDULES[scheduleType];
  }

  calculateNextReview(currentInterval, reviewCount, quality, easeFactor = 2.5) {
    let newEaseFactor = easeFactor;
    let intervalIndex = Math.min(reviewCount, this.schedule.intervals.length - 1);
    let nextInterval;

    switch (quality) {
      case 'hard':
        intervalIndex = Math.max(0, intervalIndex - 1);
        newEaseFactor = Math.max(1.3, easeFactor - 0.2);
        nextInterval = this.schedule.intervals[intervalIndex];
        break;
      case 'good':
        nextInterval = this.schedule.intervals[intervalIndex];
        break;
      case 'easy':
        intervalIndex = Math.min(this.schedule.intervals.length - 1, intervalIndex + 1);
        newEaseFactor = Math.min(3.0, easeFactor + 0.15);
        nextInterval = this.schedule.intervals[intervalIndex];
        break;
    }

    if (reviewCount > 2) {
      nextInterval = Math.round(nextInterval * newEaseFactor);
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

    return {
      quality,
      nextReviewDate,
      intervalDays: nextInterval,
      easeFactor: newEaseFactor
    };
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();
