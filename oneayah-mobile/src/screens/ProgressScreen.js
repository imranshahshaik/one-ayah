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
import { useAuth } from '../providers/AuthProvider';
import { useUserProgress, useMemorizedAyahs } from '../hooks/useSupabaseData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ProgressScreen({ navigation }) {
  const { user } = useAuth();
  const { progress } = useUserProgress();
  const { memorizedAyahs } = useMemorizedAyahs();
  const [activeTab, setActiveTab] = useState('overview');
  const insets = useSafeAreaInsets();

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
          onPress={() => navigation.navigate('Memorization')}
        >
          <Ionicons name="add" size={24} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Continue Learning</Text>
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'analytics' },
    { id: 'memorized', label: 'Memorized', icon: 'list' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>

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

      <View style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'memorized' && renderMemorized()}
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
});