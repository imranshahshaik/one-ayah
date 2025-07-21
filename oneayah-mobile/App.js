import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Simple test component to ensure the app loads
export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor="#1a1a1a" />
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading OneAyah...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <Ionicons name="book" size={60} color="#22c55e" />
        <Text style={styles.title}>OneAyah Mobile</Text>
        <Text style={styles.subtitle}>Your Quran Memorization Journey</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Memorize one ayah a day in 5 minutes.{'\n'}
          Start where you want. Listen. Repeat. Remember.
        </Text>

        <TouchableOpacity style={styles.button}>
          <Ionicons name="play" size={20} color="white" />
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            <Text style={styles.featureText}>Track Progress</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="flame" size={24} color="#ff6b35" />
            <Text style={styles.featureText}>Build Streaks</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="volume-high" size={24} color="#3b82f6" />
            <Text style={styles.featureText}>Audio Playback</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>OneAyah v1.0.0</Text>
      </View>
    </SafeAreaView>
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
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#a3a3a3',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: '#a3a3a3',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  features: {
    width: '100%',
    gap: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  featureText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 12,
  },
});