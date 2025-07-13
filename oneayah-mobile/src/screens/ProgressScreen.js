import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const { user, supabase } = useAuth();
  const [stats, setStats] = useState({
    totalMemorized: 0,
    currentStreak: 0,
    bestStreak: 0,
    pagesCompleted: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user]);

  const loadProgressData = async () => {
    try {
      // Load user progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (progress) {
        setStats({
          totalMemorized: progress.total_memorized || 0,
          currentStreak: progress.current_streak || 0,
          bestStreak: progress.best_streak || 0,
          pagesCompleted: progress.pages_completed || 0,
        });
      }

      // Load recent memorized ayahs
      const { data: recentAyahs } = await supabase
        .from('memorized_ayahs')
        .select(`
          *,
          ayahs!inner(text_arabic, surah_number, ayah_number)
        `)
        .eq('user_id', user.id)
        .order('memorized_at', { ascending: false })
        .limit(10);

      setRecentActivity(recentAyahs || []);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.title}>Your Progress</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
          <Text style={styles.statNumber}>{stats.totalMemorized}</Text>
          <Text style={styles.statLabel}>Ayahs Memorized</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="flame" size={32} color="#ff6b35" />
          <Text style={styles.statNumber}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trophy" size={32} color="#fbbf24" />
          <Text style={styles.statNumber}>{stats.bestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="book" size={32} color="#3b82f6" />
          <Text style={styles.statNumber}>{stats.pagesCompleted}</Text>
          <Text style={styles.statLabel}>Pages Completed</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <Text style={styles.progressTitle}>Quran Progress</Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${(stats.totalMemorized / 6236) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {stats.totalMemorized} / 6,236 ayahs ({((stats.totalMemorized / 6236) * 100).toFixed(1)}%)
        </Text>
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.length > 0 ? (
          recentActivity.map((item, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="checkmark" size={16} color="#22c55e" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  Memorized Surah {item.ayahs.surah_number}, Ayah {item.ayahs.ayah_number}
                </Text>
                <Text style={styles.activityDate}>
                  {new Date(item.memorized_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noActivityText}>
            No memorized ayahs yet. Start your journey!
          </Text>
        )}
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsList}>
          <View style={[
            styles.achievementCard,
            stats.totalMemorized >= 1 && styles.achievementCardUnlocked
          ]}>
            <Ionicons 
              name="star" 
              size={24} 
              color={stats.totalMemorized >= 1 ? "#fbbf24" : "#6b7280"} 
            />
            <Text style={[
              styles.achievementText,
              stats.totalMemorized >= 1 && styles.achievementTextUnlocked
            ]}>
              First Steps
            </Text>
            <Text style={styles.achievementDesc}>Memorize your first ayah</Text>
          </View>

          <View style={[
            styles.achievementCard,
            stats.totalMemorized >= 10 && styles.achievementCardUnlocked
          ]}>
            <Ionicons 
              name="medal" 
              size={24} 
              color={stats.totalMemorized >= 10 ? "#fbbf24" : "#6b7280"} 
            />
            <Text style={[
              styles.achievementText,
              stats.totalMemorized >= 10 && styles.achievementTextUnlocked
            ]}>
              Growing Strong
            </Text>
            <Text style={styles.achievementDesc}>Memorize 10 ayahs</Text>
          </View>

          <View style={[
            styles.achievementCard,
            stats.currentStreak >= 7 && styles.achievementCardUnlocked
          ]}>
            <Ionicons 
              name="flame" 
              size={24} 
              color={stats.currentStreak >= 7 ? "#ff6b35" : "#6b7280"} 
            />
            <Text style={[
              styles.achievementText,
              stats.currentStreak >= 7 && styles.achievementTextUnlocked
            ]}>
              Week Warrior
            </Text>
            <Text style={styles.achievementDesc}>7-day streak</Text>
          </View>
        </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: (width - 52) / 2,
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
    textAlign: 'center',
  },
  progressBar: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  progressTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  progressText: {
    fontSize: 12,
    color: '#a3a3a3',
    marginTop: 8,
  },
  recentSection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    color: 'white',
    fontSize: 14,
  },
  activityDate: {
    color: '#a3a3a3',
    fontSize: 12,
    marginTop: 2,
  },
  noActivityText: {
    color: '#a3a3a3',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  achievementsSection: {
    margin: 20,
    marginBottom: 40,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  achievementCardUnlocked: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  achievementText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  achievementTextUnlocked: {
    color: 'white',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#a3a3a3',
  },
});