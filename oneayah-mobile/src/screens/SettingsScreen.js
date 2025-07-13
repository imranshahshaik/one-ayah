import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';

export default function SettingsScreen() {
  const { user, signOut, supabase } = useAuth();
  const [settings, setSettings] = useState({
    darkMode: true,
    notifications: true,
    autoPlay: true,
    translationOn: true,
    transliterationOn: true,
    playbackCount: 5,
    fontSize: 'medium',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings({
          darkMode: data.dark_mode ?? true,
          notifications: data.notifications_enabled ?? true,
          autoPlay: data.auto_play ?? true,
          translationOn: data.translation_on ?? true,
          transliterationOn: data.transliteration_on ?? true,
          playbackCount: data.playback_count ?? 5,
          fontSize: data.font_size ?? 'medium',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const dbKey = {
        darkMode: 'dark_mode',
        notifications: 'notifications_enabled',
        autoPlay: 'auto_play',
        translationOn: 'translation_on',
        transliterationOn: 'transliteration_on',
        playbackCount: 'playback_count',
        fontSize: 'font_size',
      }[key];

      await supabase
        .from('user_settings')
        .update({ [dbKey]: value })
        .eq('user_id', user.id);

      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Could not update setting');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: signOut, style: 'destructive' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#a3a3a3" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.email}</Text>
            <Text style={styles.profileEmail}>Tap to edit profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#a3a3a3" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reading Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="text" size={20} color="#a3a3a3" />
            <Text style={styles.settingLabel}>Show Translation</Text>
          </View>
          <Switch
            value={settings.translationOn}
            onValueChange={(value) => updateSetting('translationOn', value)}
            trackColor={{ false: '#767577', true: '#22c55e' }}
            thumbColor={settings.translationOn ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="language" size={20} color="#a3a3a3" />
            <Text style={styles.settingLabel}>Show Transliteration</Text>
          </View>
          <Switch
            value={settings.transliterationOn}
            onValueChange={(value) => updateSetting('transliterationOn', value)}
            trackColor={{ false: '#767577', true: '#22c55e' }}
            thumbColor={settings.transliterationOn ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="text-outline" size={20} color="#a3a3a3" />
            <Text style={styles.settingLabel}>Font Size</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{settings.fontSize}</Text>
            <Ionicons name="chevron-forward" size={16} color="#a3a3a3" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="play" size={20} color="#a3a3a3" />
            <Text style={styles.settingLabel}>Auto Play</Text>
          </View>
          <Switch
            value={settings.autoPlay}
            onValueChange={(value) => updateSetting('autoPlay', value)}
            trackColor={{ false: '#767577', true: '#22c55e' }}
            thumbColor={settings.autoPlay ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="repeat" size={20} color="#a3a3a3" />
            <Text style={styles.settingLabel}>Default Repeat Count</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>{settings.playbackCount}x</Text>
            <Ionicons name="chevron-forward" size={16} color="#a3a3a3" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={20} color="#a3a3a3" />
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(value) => updateSetting('notifications', value)}
            trackColor={{ false: '#767577', true: '#22c55e' }}
            thumbColor={settings.notifications ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="time" size={20} color="#a3a3a3" />
            <Text style={styles.settingLabel}>Reminder Time</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>8:00 AM</Text>
            <Ionicons name="chevron-forward" size={16} color="#a3a3a3" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="help-circle" size={20} color="#a3a3a3" />
            <Text style={styles.settingLabel}>Help & FAQ</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#a3a3a3" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="mail" size={20} color="#a3a3a3" />
            <Text style={styles.settingLabel}>Contact Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#a3a3a3" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="star" size={20} color="#a3a3a3" />
            <Text style={styles.settingLabel}>Rate App</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#a3a3a3" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>OneAyah Mobile v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  profileSection: {
    padding: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 14,
    color: '#a3a3a3',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 1,
    borderRadius: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    color: '#a3a3a3',
    marginRight: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
  },
  signOutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
});