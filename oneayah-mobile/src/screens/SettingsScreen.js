import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabaseService, supabase } from '../services/SupabaseService';
import { notificationService } from '../services/NotificationService';

const SettingsScreen = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const userSettings = await supabaseService.getUserSettings();
        setSettings(userSettings);
      } catch (error) {
        console.error('Error fetching settings:', error);
        Alert.alert('Error', 'Failed to fetch settings. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await supabaseService.updateUserSettings({ [key]: value });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const time = `${hours}:${minutes}`;
      updateSetting('notification_time', time);
      notificationService.scheduleDailyNotification(selectedTime.getHours(), selectedTime.getMinutes());
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Dark Mode</Text>
        <Switch
          value={settings?.dark_mode || false}
          onValueChange={(value) => updateSetting('dark_mode', value)}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Auto Play Audio</Text>
        <Switch
          value={settings?.auto_play || false}
          onValueChange={(value) => updateSetting('auto_play', value)}
        />
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Show Transliteration</Text>
        <Switch
          value={settings?.transliteration_on || false}
          onValueChange={(value) => updateSetting('transliteration_on', value)}
        />
      </View>

      <View style={styles.pickerRow}>
        <Text style={styles.settingLabel}>Font Size</Text>
        <Picker
          selectedValue={settings?.font_size || 'medium'}
          style={styles.picker}
          onValueChange={(value) => updateSetting('font_size', value)}
        >
          <Picker.Item label="Small" value="small" />
          <Picker.Item label="Medium" value="medium" />
          <Picker.Item label="Large" value="large" />
          <Picker.Item label="Extra Large" value="extra-large" />
        </Picker>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Enable Notifications</Text>
        <Switch
          value={settings?.notifications_enabled || false}
          onValueChange={(value) => updateSetting('notifications_enabled', value)}
        />
      </View>

      {settings?.notifications_enabled && (
        <View style={styles.pickerRow}>
          <TouchableOpacity onPress={() => setShowTimePicker(true)}>
            <Text style={styles.settingLabel}>Notification Time: {settings?.notification_time || '08:00'}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={new Date(`2022-01-01T${settings?.notification_time || '08:00'}:00`)}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={onTimeChange}
            />
          )}
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  pickerRow: {
    marginBottom: 25,
  },
  settingLabel: {
    color: 'white',
    fontSize: 18,
  },
  picker: {
    color: 'white',
    backgroundColor: '#333',
    borderRadius: 10,
  },
  logoutButton: {
    backgroundColor: '#ff6b35',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
