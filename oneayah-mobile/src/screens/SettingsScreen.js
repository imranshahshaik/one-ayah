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
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
  const { user, signOut } = useAuth();
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
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('oneayah_settings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem('oneayah_settings', JSON.stringify(newSettings));
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

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('oneayah_settings');
              setSettings({
                darkMode: true,
                notifications: true,
                autoPlay: true,
                translationOn: true,
                transliterationOn: true,
                playbackCount: 5,
                fontSize: 'medium',
              });
              Alert.alert('Success', 'Settings have been reset to default');
            } catch (error) {
              Alert.alert('Error', 'Could not reset settings');
            }
          },
          style: 'destructive' 
        },
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="#a3a3a3" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user.user_metadata?.full_name || 'User'}
                </Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Reading Preferences */}
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

        {/* Audio Settings */}
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

        {/* App Settings */}
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

        {/* Support */}
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

        {/* Reset & Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
            <Ionicons name="refresh" size={20} color="#ef4444" />
            <Text style={styles.resetText}>Reset Settings</Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out" size={20} color="#ef4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>OneAyah Mobile v1.0.0</Text>
          <Text style={styles.footerSubtext}>
            Memorize one ayah a day in 5 minutes
          </Text>
        </View>
      </ScrollView>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 16,
  },
  content: {
    flex: 1,
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  resetText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
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
  footerSubtext: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
});