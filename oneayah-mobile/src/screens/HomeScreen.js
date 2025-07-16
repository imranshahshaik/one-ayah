import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { useUserProgress, useMemorizedAyahs } from '../hooks/useSupabaseData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { progress } = useUserProgress();
  const { memorizedAyahs } = useMemorizedAyahs();
  const [signingIn, setSigningIn] = useState(false);
  const insets = useSafeAreaInsets();

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        Alert.alert('Sign In Error', result.error || 'Failed to sign in');
      }
    } catch (error) {
      Alert.alert('Sign In Error', error.message);
    } finally {
      setSigningIn(false);
    }
  };

  const handleStartMemorizing = () => {
    if (user) {
      navigation.navigate('Memorization');
    } else {
      Alert.alert(
        'Sign In Required',
        'Please sign in to save your progress and access all features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: handleGoogleSignIn },
        ]
      );
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading OneAyah...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.gradient}
        >
          <ScrollView contentContainerStyle={styles.welcomeContainer}>
            <Ionicons name="book" size={80} color="#22c55e" />
            <Text style={styles.appTitle}>OneAyah</Text>
            <Text style={styles.subtitle}>Your Quran Memorization Journey</Text>
            <Text style={styles.description}>
              Memorize one ayah a day in 5 minutes.{'\n'}
              Start where you want. Listen. Repeat. Remember.
            </Text>
            
            <TouchableOpacity 
              style={[styles.loginButton, signingIn && styles.loginButtonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={signingIn}
            >
              {signingIn ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="logo-google" size={20} color="white" style={styles.googleIcon} />
              )}
              <Text style={styles.loginButtonText}>
                {signingIn ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.privacyText}>
              Sign in to save your progress across devices
            </Text>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>Assalamu Alaikum</Text>
            <Text style={styles.userName}>
              {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
            </Text>
          </View>

          <View style={styles.todaySection}>
            <Text style={styles.sectionTitle}>Today's Progress</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="flame" size={24} color="#ff6b35" />
                <Text style={styles.statNumber}>{progress?.current_streak || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                <Text style={styles.statNumber}>{progress?.total_memorized || 0}</Text>
                <Text style={styles.statLabel}>Memorized</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trophy" size={24} color="#fbbf24" />
                <Text style={styles.statNumber}>{progress?.pages_completed || 0}</Text>
                <Text style={styles.statLabel}>Pages</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="book" size={24} color="#3b82f6" />
                <Text style={styles.statNumber}>{memorizedAyahs.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>

          <View style={styles.todaysAyahSection}>
            <Text style={styles.sectionTitle}>Today's Ayah</Text>
            <View style={styles.todaysAyahCard}>
              <View style={styles.ayahHeader}>
                <Text style={styles.ayahReference}>
                  Surah {progress?.last_visited_surah || 1}, Ayah {progress?.last_visited_ayah || 1}
                </Text>
                <Text style={styles.ayahDate}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.startButton}
                onPress={handleStartMemorizing}
              >
                <Ionicons name="play" size={20} color="white" />
                <Text style={styles.startButtonText}>Start Memorizing</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleStartMemorizing}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.actionGradient}
              >
                <Ionicons name="add-circle" size={40} color="white" />
                <Text style={styles.actionTitle}>Continue Learning</Text>
                <Text style={styles.actionSubtitle}>Memorize new ayahs</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Progress')}
            >
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.actionGradient}
              >
                <Ionicons name="analytics" size={40} color="white" />
                <Text style={styles.actionTitle}>View Progress</Text>
                <Text style={styles.actionSubtitle}>Check your achievements</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {progress?.current_streak > 0 && (
            <View style={styles.motivationSection}>
              <Text style={styles.motivationText}>
                🔥 You're on fire! {progress.current_streak} day streak
              </Text>
              <Text style={styles.motivationSubtext}>
                Don't break the chain - memorize today!
              </Text>
            </View>
          )}
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
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
    marginTop: 16,
  },
  gradient: {
    flex: 1,
    minHeight: '100%',
  },
  welcomeContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#a3a3a3',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#a3a3a3',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
    minHeight: 50,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    marginRight: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  privacyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  greeting: {
    fontSize: 24,
    color: 'white',
    fontWeight: '600',
  },
  userName: {
    fontSize: 16,
    color: '#a3a3a3',
    marginTop: 4,
  },
  todaySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 60) / 2,
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#a3a3a3',
    marginTop: 4,
  },
  todaysAyahSection: {
    padding: 20,
  },
  todaysAyahCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  ayahHeader: {
    marginBottom: 16,
  },
  ayahReference: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  ayahDate: {
    fontSize: 14,
    color: '#a3a3a3',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsSection: {
    padding: 20,
    gap: 16,
  },
  actionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 24,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginTop: 12,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  motivationSection: {
    margin: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b35',
    textAlign: 'center',
  },
  motivationSubtext: {
    fontSize: 14,
    color: '#ff8c5a',
    textAlign: 'center',
    marginTop: 4,
  },
});