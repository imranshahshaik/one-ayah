import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useUserProgress, useMemorizedAyahs } from '../hooks/useSupabaseData';
import { supabaseService } from '../services/SupabaseService';

const { width } = Dimensions.get('window');

export default function ProgressScreen({ navigation, route }) {
  const { user } = useAuth();
  const { progress } = useUserProgress();
  const { memorizedAyahs } = useMemorizedAyahs();
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'overview');
  const [dueReviews, setDueReviews] = useState([]);
  const [dailySessions, setDailySessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user, activeTab]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reviews') {
        const reviews = await supabaseService.getDueReviews();
        setDueReviews(reviews);
      } else if (activeTab === 'calendar') {
        const sessions = await supabaseService.getDailySessions(30);
        setDailySessions(sessions);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      {/* Progress Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
          <Text style={styles.statNumber}>{progress?.total_memorized || 0}</Text>
          <Text style={styles.statLabel}>Ayahs Memorized</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="flame" size={32} color="#ff6b35" />
          <Text style={styles.statNumber}>{progress?.current_streak || 0}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="trophy" size={32} color="#fbbf24" />
          <Text style={styles.statNumber}>{progress?.best_streak || 0}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="book" size={32} color="#3b82f6" />
          <Text style={styles.statNumber}>{progress?.pages_completed || 0}</Text>
          <Text style={styles.statLabel}>Pages Completed</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Quran Progress</Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${((progress?.total_memorized || 0) / 6236) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {progress?.total_memorized || 0} / 6,236 ayahs ({(((progress?.total_memorized || 0) / 6236) * 100).toFixed(1)}%)
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setActiveTab('memorized')}
        >
          <Ionicons name="list" size={24} color="#22c55e" />
          <Text style={styles.actionButtonText}>View Memorized</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setActiveTab('reviews')}
        >
          <Ionicons name="refresh" size={24} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Due Reviews</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderMemorized = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Memorized Ayahs ({memorizedAyahs.length})
        </Text>
      </View>

      {memorizedAyahs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color="#6b7280" />
          <Text style={styles.emptyStateTitle}>No Ayahs Memorized Yet</Text>
          <Text style={styles.emptyStateText}>
            Start memorizing ayahs to see them here.
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => navigation.navigate('Memorization')}
          >
            <Text style={styles.startButtonText}>Start Memorizing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={memorizedAyahs}
          keyExtractor={(item) => `${item.surah_number}-${item.ayah_number}`}
          renderItem={({ item }) => (
            <View style={styles.ayahItem}>
              <View style={styles.ayahInfo}>
                <Text style={styles.ayahTitle}>
                  Surah {item.surah_number}, Ayah {item.ayah_number}
                </Text>
                <Text style={styles.ayahDate}>
                  Memorized on {formatDate(item.memorized_at)}
                </Text>
              </View>
              <View style={styles.ayahBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );

  const renderReviews = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Due Reviews ({dueReviews.length})
        </Text>
      </View>

      {dueReviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
          <Text style={styles.emptyStateTitle}>All Caught Up!</Text>
          <Text style={styles.emptyStateText}>
            No reviews due today. Great job staying on track!
          </Text>
        </View>
      ) : (
        <FlatList
          data={dueReviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.reviewItem}>
              <View style={styles.reviewInfo}>
                <Text style={styles.reviewTitle}>
                  Surah {item.surah_number}, Ayah {item.ayah_number}
                </Text>
                <Text style={styles.reviewStatus}>
                  {item.days_overdue === 0 ? 'Due today' : `${item.days_overdue} days overdue`}
                </Text>
              </View>
              <TouchableOpacity style={styles.reviewButton}>
                <Text style={styles.reviewButtonText}>Review</Text>
              </TouchableOpacity>
            </View>
          )}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );

  const renderCalendar = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Activity Calendar</Text>
      </View>

      <View style={styles.calendarPlaceholder}>
        <Ionicons name="calendar" size={64} color="#6b7280" />
        <Text style={styles.placeholderText}>Calendar view coming soon!</Text>
        <Text style={styles.placeholderSubtext}>
          Track your daily progress and streaks
        </Text>
      </View>
    </ScrollView>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'analytics' },
    { id: 'memorized', label: 'Memorized', icon: 'list' },
    { id: 'reviews', label: 'Reviews', icon: 'refresh' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon} 
                size={20} 
                color={activeTab === tab.id ? '#22c55e' : '#6b7280'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'memorized' && renderMemorized()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'calendar' && renderCalendar()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#22c55e',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#22c55e',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
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
  progressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
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
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#a3a3a3',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ayahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  ayahInfo: {
    flex: 1,
  },
  ayahTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  ayahDate: {
    fontSize: 14,
    color: '#a3a3a3',
    marginTop: 4,
  },
  ayahBadge: {
    marginLeft: 12,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  reviewStatus: {
    fontSize: 14,
    color: '#ff6b35',
    marginTop: 4,
  },
  reviewButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reviewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#a3a3a3',
    textAlign: 'center',
  },
});