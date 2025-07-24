import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { recordingService } from '../services/RecordingService';

const MemorizationScreen = ({ route, navigation }) => {
  const { surah, ayah } = route.params;
  const [ayahData, setAyahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [isMemorized, setIsMemorized] = useState(false);
  const [surahs, setSurahs] = useState([]);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  useEffect(() => {
    const fetchAyahData = async () => {
      setLoading(true);
      try {
        const surahData = await supabaseService.getSurahs();
        setSurahs(surahData);
        const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/ar.alafasy`);
        const result = await response.json();
        const translationResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.sahih`);
        const translationResult = await translationResponse.json();
        const transliterationResponse = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.transliteration`);
        const transliterationResult = await transliterationResponse.json();

        setAyahData({
          ...result.data,
          translation: translationResult.data.text,
          transliteration: transliterationResult.data.text,
        });
      } catch (error) {
        console.error('Error fetching ayah data:', error);
        Alert.alert('Error', 'Failed to fetch ayah data. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAyahData();
  }, [surah, ayah]);

  const playSound = async () => {
    if (sound) {
      await sound.stopAsync();
      setSound(null);
      setPlaybackPosition(0);
    } else {
      if (ayahData?.audio) {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: ayahData.audio },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(sound);
        setPlaybackDuration(status.durationMillis);
      }
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis);
    }
  };

  const onSeek = async (value) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const formatTime = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const goToNextAyah = () => {
    const currentSurah = surahs.find(s => s.number === surah);
    if (currentSurah && ayah < currentSurah.number_of_ayahs) {
      navigation.replace('Memorization', { surah, ayah: ayah + 1 });
    } else if (surah < 114) {
      navigation.replace('Memorization', { surah: surah + 1, ayah: 1 });
    }
  };

  const goToPreviousAyah = () => {
    if (ayah > 1) {
      navigation.replace('Memorization', { surah, ayah: ayah - 1 });
    } else if (surah > 1) {
      const prevSurah = surahs.find(s => s.number === surah - 1);
      if (prevSurah) {
        navigation.replace('Memorization', { surah: surah - 1, ayah: prevSurah.number_of_ayahs });
      }
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    await recordingService.startRecording();
  };

  const stopRecording = async () => {
    setIsRecording(false);
    const uri = await recordingService.stopRecording();
    const savedUri = await recordingService.saveRecording(uri, surah, ayah);
    setRecordingUri(savedUri);
  };

  const playRecording = async () => {
    if (recordingUri) {
      await recordingService.playRecording(recordingUri);
    }
  };

  useEffect(() => {
    const loadRecording = async () => {
      const uri = await recordingService.getRecording(surah, ayah);
      setRecordingUri(uri);
    };
    loadRecording();
  }, [surah, ayah]);

  useEffect(() => {
    const checkIfMemorized = async () => {
      // This is a simplified check. In a real app, you'd fetch the memorized status from Supabase.
      const memorizedAyahs = await supabaseService.getMemorizedAyahs();
      const isAyahMemorized = memorizedAyahs.some(
        (item) => item.surah_number === surah && item.ayah_number === ayah
      );
      setIsMemorized(isAyahMemorized);
    };
    checkIfMemorized();
  }, [surah, ayah]);

  const handleMarkAsMemorized = async () => {
    if (isMemorized) {
      await supabaseService.deleteMemorizedAyah(surah, ayah);
      setIsMemorized(false);
    } else {
      const reviewResult = spacedRepetitionService.calculateNextReview(0, 0, 'good');
      await supabaseService.addMemorizedAyah(surah, ayah, ayahData.surah.page, reviewResult);
      setIsMemorized(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!ayahData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Could not load ayah data.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Surah {ayahData.surah.englishName} ({ayahData.surah.name})
        </Text>
        <Text style={styles.headerText}>Ayah {ayahData.numberInSurah}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.arabicText}>{ayahData.text}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.translationText}>{ayahData.translation}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.transliterationText}>{ayahData.transliteration}</Text>
      </View>

      <View style={styles.audioPlayer}>
        <TouchableOpacity style={styles.playButton} onPress={playSound}>
          <Text style={styles.buttonText}>{sound ? 'Stop' : 'Play'}</Text>
        </TouchableOpacity>
        <Slider
          style={{ flex: 1, marginHorizontal: 10 }}
          minimumValue={0}
          maximumValue={playbackDuration}
          value={playbackPosition}
          onSlidingComplete={onSeek}
          disabled={!sound}
        />
        <Text style={styles.durationText}>{formatTime(playbackPosition)} / {formatTime(playbackDuration)}</Text>
      </View>

      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recording]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>{isRecording ? 'Recording...' : 'Record'}</Text>
      </TouchableOpacity>

      {recordingUri && (
        <TouchableOpacity style={styles.button} onPress={playRecording}>
          <Text style={styles.buttonText}>Play Recording</Text>
        </TouchableOpacity>
      )}

      <View style={styles.memorizedContainer}>
        <TouchableOpacity
          style={[styles.checkbox, isMemorized && styles.checked]}
          onPress={handleMarkAsMemorized}
        >
          {isMemorized && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <Text style={styles.memorizedText}>Mark as Memorized</Text>
      </View>

      <View style={styles.navigation}>
        <TouchableOpacity style={styles.navButton} onPress={goToPreviousAyah}>
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={goToNextAyah}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 10,
  },
  header: {
    padding: 15,
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
  },
  arabicText: {
    color: 'white',
    fontSize: 28,
    textAlign: 'right',
  },
  translationText: {
    color: 'white',
    fontSize: 18,
    fontStyle: 'italic',
  },
  transliterationText: {
    color: 'white',
    fontSize: 18,
  },
  button: {
    backgroundColor: '#22c55e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 18,
  },
});

export default MemorizationScreen;
