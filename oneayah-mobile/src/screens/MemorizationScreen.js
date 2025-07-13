import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';

export default function MemorizationScreen() {
  const { user, supabase } = useAuth();
  const [currentAyah, setCurrentAyah] = useState(null);
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(5);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentAyah();
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const loadCurrentAyah = async () => {
    try {
      // Get user's current progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select('last_visited_surah, last_visited_ayah')
        .eq('user_id', user.id)
        .single();

      const surahNumber = progress?.last_visited_surah || 1;
      const ayahNumber = progress?.last_visited_ayah || 1;

      // Get the ayah data
      const { data: ayah } = await supabase
        .from('ayahs')
        .select('*')
        .eq('surah_number', surahNumber)
        .eq('ayah_number', ayahNumber)
        .single();

      if (ayah) {
        setCurrentAyah(ayah);
      }
    } catch (error) {
      console.error('Error loading ayah:', error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      if (!currentAyah) return;

      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${currentAyah.surah_number}/${currentAyah.ayah_number}.mp3`;
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          if (currentRepeat < repeatCount - 1) {
            setCurrentRepeat(prev => prev + 1);
            // Auto-replay after a short delay
            setTimeout(() => {
              playAudio();
            }, 1000);
          } else {
            setCurrentRepeat(0);
          }
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Audio Error', 'Could not play audio');
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
    if (!currentAyah || !user) return;

    try {
      // Insert into memorized_ayahs
      await supabase.from('memorized_ayahs').insert({
        user_id: user.id,
        surah_number: currentAyah.surah_number,
        ayah_number: currentAyah.ayah_number,
        page_number: currentAyah.page_number,
      });

      // Update user progress
      await supabase
        .from('user_progress')
        .update({
          total_memorized: supabase.raw('total_memorized + 1'),
          last_memorized_date: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', user.id);

      Alert.alert('Success!', 'Ayah marked as memorized!');
      
      // Move to next ayah
      loadNextAyah();
    } catch (error) {
      console.error('Error marking as memorized:', error);
      Alert.alert('Error', 'Could not mark as memorized');
    }
  };

  const loadNextAyah = async () => {
    if (!currentAyah) return;

    try {
      // Get next ayah
      const { data: nextAyah } = await supabase
        .from('ayahs')
        .select('*')
        .eq('surah_number', currentAyah.surah_number)
        .eq('ayah_number', currentAyah.ayah_number + 1)
        .single();

      if (nextAyah) {
        setCurrentAyah(nextAyah);
        // Update user progress
        await supabase
          .from('user_progress')
          .update({
            last_visited_surah: nextAyah.surah_number,
            last_visited_ayah: nextAyah.ayah_number,
          })
          .eq('user_id', user.id);
      } else {
        // Move to next surah
        const { data: firstAyahNextSurah } = await supabase
          .from('ayahs')
          .select('*')
          .eq('surah_number', currentAyah.surah_number + 1)
          .eq('ayah_number', 1)
          .single();

        if (firstAyahNextSurah) {
          setCurrentAyah(firstAyahNextSurah);
          await supabase
            .from('user_progress')
            .update({
              last_visited_surah: firstAyahNextSurah.surah_number,
              last_visited_ayah: 1,
            })
            .eq('user_id', user.id);
        }
      }
    } catch (error) {
      console.error('Error loading next ayah:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!currentAyah) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No ayah found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.surahInfo}>
          Surah {currentAyah.surah_number} - Ayah {currentAyah.ayah_number}
        </Text>
      </View>

      <View style={styles.ayahContainer}>
        <Text style={styles.arabicText}>{currentAyah.text_arabic}</Text>
        
        {currentAyah.text_english && (
          <Text style={styles.englishText}>{currentAyah.text_english}</Text>
        )}

        {currentAyah.text_transliteration && (
          <Text style={styles.transliterationText}>
            {currentAyah.text_transliteration}
          </Text>
        )}
      </View>

      <View style={styles.controlsContainer}>
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
          <TouchableOpacity style={styles.memorizedButton} onPress={markAsMemorized}>
            <Ionicons name="checkmark" size={24} color="white" />
            <Text style={styles.buttonText}>Mark as Memorized</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={loadNextAyah}>
            <Ionicons name="arrow-forward" size={24} color="white" />
            <Text style={styles.buttonText}>Next Ayah</Text>
          </TouchableOpacity>
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
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  surahInfo: {
    fontSize: 18,
    color: '#22c55e',
    fontWeight: '600',
  },
  ayahContainer: {
    padding: 20,
    margin: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
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
    padding: 20,
  },
  repeatControls: {
    marginBottom: 20,
  },
  repeatLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 12,
  },
  repeatButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  repeatButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    marginBottom: 20,
  },
  progressText: {
    color: '#a3a3a3',
    fontSize: 14,
  },
  audioControls: {
    alignItems: 'center',
    marginBottom: 30,
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
    gap: 12,
  },
  memorizedButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});