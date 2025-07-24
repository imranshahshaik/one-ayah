import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('You need to enable notifications in your settings.');
      return false;
    }
    return true;
  }

  async scheduleDailyNotification(hour, minute) {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "OneAyah Reminder",
        body: 'Time for your daily ayah memorization!',
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  }

  async showInstantNotification(title, body) {
    await Notifications.presentNotificationAsync({
      title,
      body,
      content: {
        sound: true,
      },
    });
  }
}

export const notificationService = new NotificationService();
