import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useUserProgress, useMemorizedAyahs } from '../hooks/useSupabaseData';
import { supabaseService } from '../services/SupabaseService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) => {
  const { user, loading, signInWithOAuth } = useAuth();
  const { progress } = useUserProgress();
  const { memorizedAyahs } = useMemorizedAyahs();
  const [dueReviewsCount, setDueReviewsCount] = useState(0);
  const [todaysAyah, setTodaysAyah] = useState(null);

  useEffect(() => {
    if (user) {
      loadDueReviews();
      loadTodaysAyah();
    }
  }, [user, progress]);

  const loadDueReviews = async () => {
    try {
      const reviews = await supabaseService.getDueReviews();
      setDueReviewsCount(reviews.length);
    } catch (error) {
      console.error('Error loading due reviews:', error);
    }
  };

  const loadTodaysAyah = async () => {
    const surah = progress?.last_visited_surah || 1;
    const ayah = progress?.last_visited_ayah || 1;
    setTodaysAyah({ surah, ayah });
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithOAuth('google');
    if (!result.success) {
      Alert.alert('Sign In Error', result.error);
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

  const handleReviewPress = () => {
    navigation.navigate('Progress', { initialTab: 'reviews' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.gradient}
        >
          <View style={styles.welcomeContainer}>
            <Ionicons name="book" size={80} color="#22c55e" />
            <Text style={styles.appTitle}>OneAyah</Text>
            <Text style={styles.subtitle}>Your Quran Memorization Journey</Text>
            <Text style={styles.description}>
              Memorize one ayah a day in 5 minutes.{'\n'}
              Start where you want. Listen. Repeat. Remember.
            </Text>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleGoogleSignIn}
            >
              <Ionicons name="logo-google" size={20} color="white" style={styles.googleIcon} />
              <Text style={styles.loginButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            
            <Text style={styles.privacyText}>
              Sign in to save your progress across devices
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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

        {/* Today's Goal Status */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          
          {/* Stats Grid */}
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
              <Ionicons name="refresh" size={24} color="#3b82f6" />
              <Text style={styles.statNumber}>{dueReviewsCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={24} color="#fbbf24" />
              <Text style={styles.statNumber}>{progress?.pages_completed || 0}</Text>
              <Text style={styles.statLabel}>Pages</Text>
            </View>
          </View>
        </View>

        {/* Due Reviews Alert */}
        {dueReviewsCount > 0 && (
          <TouchableOpacity style={styles.reviewAlert} onPress={handleReviewPress}>
            <View style={styles.reviewAlertContent}>
              <Ionicons name="notifications" size={24} color="#ff6b35" />
              <View style={styles.reviewAlertText}>
                <Text style={styles.reviewAlertTitle}>
                  {dueReviewsCount} Review{dueReviewsCount === 1 ? '' : 's'} Due!
                </Text>
                <Text style={styles.reviewAlertSubtitle}>
                  Strengthen your memory with spaced repetition
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ff6b35" />
            </View>
          </TouchableOpacity>
        )}

        {/* Today's Ayah */}
        {todaysAyah && (
          <View style={styles.todaysAyahSection}>
            <Text style={styles.sectionTitle}>Today's Ayah</Text>
            <View style={styles.todaysAyahCard}>
              <View style={styles.ayahHeader}>
                <Text style={styles.ayahReference}>
                  Surah {todaysAyah.surah}, Ayah {todaysAyah.ayah}
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
        )}

        {/* Action Cards */}
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

        {/* Motivational Section */}
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
  gradient: {
    flex: 1,
    minHeight: '100%',
  },
  welcomeContainer: {
    flex: 1,
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
  },
  googleIcon: {
    marginRight: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
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
  reviewAlert: {
    margin: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  reviewAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  reviewAlertText: {
    flex: 1,
    marginLeft: 12,
  },
  reviewAlertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b35',
  },
  reviewAlertSubtitle: {
    fontSize: 14,
    color: '#ff8c5a',
    marginTop: 2,
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