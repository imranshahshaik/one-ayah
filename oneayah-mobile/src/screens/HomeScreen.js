import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user, loading } = useAuth();

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
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => {/* Navigate to auth */}}
            >
              <Text style={styles.loginButtonText}>Get Started</Text>
            </TouchableOpacity>
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
          <Text style={styles.userName}>{user.email}</Text>
        </View>

        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color="#ff6b35" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Memorized</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="refresh" size={24} color="#3b82f6" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Memorization')}
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
              <Text style={styles.actionTitle}>Review Progress</Text>
              <Text style={styles.actionSubtitle}>Check your achievements</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
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
});