import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { supabaseService } from '../services/SupabaseService';
import { Calendar } from 'react-native-calendars';

const ProgressScreen = () => {
  const [progress, setProgress] = useState(null);
  const [memorizedAyahs, setMemorizedAyahs] = useState([]);
  const [dailySessions, setDailySessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const progressData = await supabaseService.getProgressStats();
        const ayahsData = await supabaseService.getMemorizedAyahs();
        const sessionsData = await supabaseService.getDailySessions();
        setProgress(progressData);
        setMemorizedAyahs(ayahsData);
        setDailySessions(sessionsData);
      } catch (error) {
        console.error('Error fetching progress data:', error);
        Alert.alert('Error', 'Failed to fetch progress data. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  const renderStat = (label, value) => (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const getMarkedDates = () => {
    const markedDates = {};
    dailySessions.forEach((session) => {
      markedDates[session.session_date] = { marked: true, dotColor: '#22c55e' };
    });
    return markedDates;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>
      <View style={styles.statsContainer}>
        {renderStat('Ayahs Memorized', progress?.totalMemorized || 0)}
        {renderStat('Current Streak', progress?.current_streak || 0)}
        {renderStat('Best Streak', progress?.best_streak || 0)}
      </View>

      <Text style={styles.subtitle}>Memorized Ayahs</Text>
      <FlatList
        data={memorizedAyahs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.ayahItem}>
            <Text style={styles.ayahText}>
              {item.surah_number}:{item.ayah_number}
            </Text>
          </View>
        )}
      />

      <Text style={styles.subtitle}>Daily Activity</Text>
      <Calendar
        markedDates={getMarkedDates()}
        theme={{
          backgroundColor: '#1a1a1a',
          calendarBackground: '#1a1a1a',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#22c55e',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#22c55e',
          dayTextColor: '#d9e1e8',
          textDisabledColor: '#333',
          arrowColor: '#22c55e',
          monthTextColor: '#22c55e',
          indicatorColor: 'blue',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16,
        }}
      />
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
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  statLabel: {
    fontSize: 14,
    color: 'gray',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  ayahItem: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  ayahText: {
    color: 'white',
    fontSize: 16,
  },
});

export default ProgressScreen;
