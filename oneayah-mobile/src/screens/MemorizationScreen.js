import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { useUserProgress, useMemorizedAyahs } from '../hooks/useSupabaseData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MemorizationScreen({ navigation }) {
  const { user, supabase, isInitialized } = useAuth();
  const { progress, refetch: refetchProgress } = useUserProgress();
  const { memorizedAyahs, addMemorizedAyah, refetch: refetchMemorized } = useMemorizedAyahs();
  
  const [currentAyah, setCurrentAyah] = useState(null);
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(5);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMemorized, setIsMemorized] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        });
      } catch (error) {
        console.log('Audio setup error:', error);
      }
    };

    initializeAudio();
    
    if (isInitialized) {
      loadCurrentAyah();
    }
    
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.error);
      }
    };
  }, [progress, isInitialized]);

  useEffect(() => {
    if (currentAyah && memorizedAyahs.length >= 0) {
      const isAlreadyMemorized = memorizedAyahs.some(
        ayah => ayah.surah_number === currentAyah.surah_number && 
                ayah.ayah_number === currentAyah.ayah_number
      );
      setIsMemorized(isAlreadyMemorized);
    }
  }, [currentAyah, memorizedAyahs]);

  const loadCurrentAyah = async () => {
    if (!isInitialized || !supabase) return;
    
    try {
      setLoading(true);
      console.log('🔄 Loading current ayah...');
      
      const surahNumber = progress?.last_visited_surah || 1;
      const ayahNumber = progress?.last_visited_ayah || 1;

      console.log('📖 Loading ayah:', surahNumber, ayahNumber);

      const { data: ayah, error } = await supabase
        .from('ayahs')
        .select('*')
        .eq('surah_number', surahNumber)
        .eq('ayah_number', ayahNumber)
        .single();

      if (error) {
        console.error('❌ Error fetching ayah:', error);
        const { data: fallbackAyah } = await supabase
          .from('ayahs')
          .select('*')
          .eq('surah_number', 1)
          .eq('ayah_number', 1)
          .single();
        
        if (fallbackAyah) {
          console.log('✅ Loaded fallback ayah');
          setCurrentAyah(fallbackAyah);
        }
      } else if (ayah) {
        console.log('✅ Loaded ayah successfully');
        setCurrentAyah(ayah);
      }
    } catch (error) {
      console.error('❌ Error loading ayah:', error);
      Alert.alert('Error', 'Failed to load ayah. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      if (!currentAyah) return;

      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${currentAyah.surah_number.toString().padStart(3, '0')}${currentAyah.ayah_number.toString().padStart(3, '0')}.mp3`;
      
      console.log('🔊 Playing audio:', audioUrl);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: true,
          isLooping: false,
          progressUpdateIntervalMillis: 500,
        }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          if (currentRepeat < repeatCount - 1) {
            setCurrentRepeat(prev => prev + 1);
            setTimeout(() => {
              playAudio();
            }, 1000);
          } else {
            setCurrentRepeat(0);
          }
        }
        if (status.error) {
          console.error('Audio playback error:', status.error);
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      setIsPlaying(false);
      Alert.alert('Audio Error', 'Could not play audio. Please check your internet connection.');
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
      setCurrentRepeat(0);
    }
  };

  const markAsMemorized = async () => {
    if (!currentAyah || !user || isMemorized || processing) return;

    setProcessing(true);
    try {
      console.log('🔄 Marking as memorized...');
      await addMemorizedAyah(currentAyah.surah_number, currentAyah.ayah_number);
      
      setIsMemorized(true);
      
      Alert.alert(
        '🎉 Ayah Memorized!', 
        `Surah ${currentAyah.surah_number}, Ayah ${currentAyah.ayah_number} has been added to your collection.`,
        [
          { text: 'Continue', onPress: loadNextAyah },
          { text: 'Stay Here', style: 'cancel' }
        ]
      );
      
      refetchProgress();
      refetchMemorized();
      
    } catch (error) {
      console.error('❌ Error marking as memorized:', error);
      Alert.alert('Error', 'Could not mark as memorized. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const loadNextAyah = async () => {
    if (!currentAyah || !supabase) return;

    try {
      console.log('🔄 Loading next ayah...');
      
      const { data: nextAyah } = await supabase
        .from('ayahs')
        .select('*')
        .eq('surah_number', currentAyah.surah_number)
        .eq('ayah_number', currentAyah.ayah_number + 1)
        .single();

      if (nextAyah) {
        setCurrentAyah(nextAyah);
      } else {
        const { data: firstAyahNextSurah } = await supabase
          .from('ayahs')
          .select('*')
          .eq('surah_number', currentAyah.surah_number + 1)
          .eq('ayah_number', 1)
          .single();

        if (firstAyahNextSurah) {
          setCurrentAyah(firstAyahNextSurah);
        }
      }
      
      setIsMemorized(false);
      refetchProgress();
    } catch (error) {
      console.error('❌ Error loading next ayah:', error);
    }
  };

  if (!isInitialized || loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading ayah...</Text>
      </View>
    );
  }

  if (!currentAyah) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Memorization</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No ayah found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCurrentAyah}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Surah {currentAyah.surah_number} - Ayah {currentAyah.ayah_number}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.contentPadding}>
          <View style={styles.ayahContainer}>
            <Text style={styles.arabicText}>{currentAyah.text_arabic}</Text>
            
            {currentAyah.text_english && (
              <Text style={styles.englishText}>{currentAyah.text_english}</Text>
            )}

            {showTransliteration && currentAyah.text_transliteration && (
              <Text style={styles.transliterationText}>
                {currentAyah.text_transliteration}
              </Text>
            )}
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => setShowTransliteration(!showTransliteration)}
            >
              <Ionicons 
                name={showTransliteration ? "eye" : "eye-off"} 
                size={20} 
                color="#22c55e" 
              />
              <Text style={styles.toggleText}>Transliteration</Text>
            </TouchableOpacity>

            <View style={styles.repeatControls}>
              <Text style={styles.repeatLabel}>Repeat Count:</Text>
              <View style={styles.repeatButtons}>
                {[3, 5, 7, 10].map(count => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.repeatButton,
                      repeatCount === count && styles.repeatButtonActive
                    ]}
                    onPress={() => setRepeatCount(count)}
                  >
                    <Text style={[
                      styles.repeatButtonText,
                      repeatCount === count && styles.repeatButtonTextActive
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Repeat: {currentRepeat + 1} / {repeatCount}
              </Text>
            </View>

            <View style={styles.audioControls}>
              {!isPlaying ? (
                <TouchableOpacity style={styles.playButton} onPress={playAudio}>
                  <Ionicons name="play" size={40} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.stopButton} onPress={stopAudio}>
                  <Ionicons name="stop" size={40} color="white" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.actionButtons}>
              {!isMemorized ? (
                <TouchableOpacity 
                  style={[styles.memorizedButton, processing && styles.memorizedButtonDisabled]} 
                  onPress={markAsMemorized}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="checkmark" size={24} color="white" />
                  )}
                  <Text style={styles.buttonText}>
                    {processing ? 'Saving...' : 'Mark as Memorized'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.memorizedIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  <Text style={styles.memorizedText}>Memorized ✓</Text>
                </View>
              )}

              <TouchableOpacity style={styles.navButton} onPress={loadNextAyah}>
                <Text style={styles.navButtonText}>Next Ayah</Text>
                <Ionicons name="chevron-forward" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
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
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    color: '#22c55e',
    fontWeight: '600',
    marginLeft: 16,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
  },
  ayahContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 20,
  },
  arabicText: {
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    lineHeight: 50,
    fontFamily: 'System',
    marginBottom: 20,
  },
  englishText: {
    fontSize: 16,
    color: '#a3a3a3',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  transliterationText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlsContainer: {
    gap: 20,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    minHeight: 48,
  },
  toggleText: {
    color: '#22c55e',
    fontSize: 16,
    marginLeft: 8,
  },
  repeatControls: {
    alignItems: 'center',
  },
  repeatLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 12,
  },
  repeatButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  repeatButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatButtonActive: {
    backgroundColor: '#22c55e',
  },
  repeatButtonText: {
    color: '#a3a3a3',
    fontSize: 14,
  },
  repeatButtonTextActive: {
    color: 'white',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: '#a3a3a3',
    fontSize: 14,
  },
  audioControls: {
    alignItems: 'center',
    marginVertical: 20,
  },
  playButton: {
    backgroundColor: '#22c55e',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    gap: 16,
  },
  memorizedButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 56,
  },
  memorizedButtonDisabled: {
    opacity: 0.7,
  },
  memorizedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    gap: 8,
    minHeight: 56,
  },
  memorizedText: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  navButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 56,
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});