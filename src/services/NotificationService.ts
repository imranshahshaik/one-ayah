export interface NotificationSettings {
  enabled: boolean;
  time: string; // HH:MM format
  message: string;
  sound: boolean;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private scheduledNotification: number | null = null;

  constructor() {
    this.permission = Notification.permission;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  async scheduleDaily(settings: NotificationSettings): Promise<boolean> {
    if (!settings.enabled || !await this.requestPermission()) {
      return false;
    }

    // Clear existing notification
    if (this.scheduledNotification) {
      clearTimeout(this.scheduledNotification);
    }

    const [hours, minutes] = settings.time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    this.scheduledNotification = window.setTimeout(() => {
      this.showNotification('OneAyah - Daily Reminder', settings.message);
      // Reschedule for next day
      this.scheduleDaily(settings);
    }, timeUntilNotification);

    console.log(`Notification scheduled for ${scheduledTime.toLocaleString()}`);
    return true;
  }

  showNotification(title: string, body: string, options?: NotificationOptions): void {
    if (this.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: '/test.png',
      badge: '/test.png',
      tag: 'oneayah-daily',
      requireInteraction: false,
      ...options
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  showInstant(title: string, body: string): void {
    this.showNotification(title, body, {
      requireInteraction: true,
      tag: 'oneayah-achievement'
    });
  }

  getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      time: '08:00',
      message: 'Time for your daily Quran memorization! 📖',
      sound: true
    };
  }

  saveSettings(settings: NotificationSettings): void {
    localStorage.setItem('oneayah_notifications', JSON.stringify(settings));
  }

  loadSettings(): NotificationSettings {
    try {
      const stored = localStorage.getItem('oneayah_notifications');
      if (stored) {
        return { ...this.getDefaultSettings(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
    return this.getDefaultSettings();
  }

  cancelScheduled(): void {
    if (this.scheduledNotification) {
      clearTimeout(this.scheduledNotification);
      this.scheduledNotification = null;
    }
  }
}

export const notificationService = new NotificationService();