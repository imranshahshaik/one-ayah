import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabaseService } from '../services/SupabaseService';

const smallSurahs = [
  { number: 78, name: 'An-Naba', number_of_ayahs: 40 },
  { number: 79, name: 'An-Naziat', number_of_ayahs: 46 },
  { number: 80, name: 'Abasa', number_of_ayahs: 42 },
  { number: 81, name: 'At-Takwir', number_of_ayahs: 29 },
  { number: 82, name: 'Al-Infitar', number_of_ayahs: 19 },
  { number: 83, name: 'Al-Mutaffifin', number_of_ayahs: 36 },
  { number: 84, name: 'Al-Inshiqaq', number_of_ayahs: 25 },
  { number: 85, name: 'Al-Buruj', number_of_ayahs: 22 },
  { number: 86, name: 'At-Tariq', number_of_ayahs: 17 },
  { number: 87, name: 'Al-Ala', number_of_ayahs: 19 },
  { number: 88, name: 'Al-Ghashiyah', number_of_ayahs: 26 },
  { number: 89, name: 'Al-Fajr', number_of_ayahs: 30 },
  { number: 90, name: 'Al-Balad', number_of_ayahs: 20 },
  { number: 91, name: 'Ash-Shams', number_of_ayahs: 15 },
  { number: 92, name: 'Al-Layl', number_of_ayahs: 21 },
  { number: 93, name: 'Ad-Duha', number_of_ayahs: 11 },
  { number: 94, name: 'Ash-Sharh', number_of_ayahs: 8 },
  { number: 95, name: 'At-Tin', number_of_ayahs: 8 },
  { number: 96, name: 'Al-Alaq', number_of_ayahs: 19 },
  { number: 97, name: 'Al-Qadr', number_of_ayahs: 5 },
  { number: 98, name: 'Al-Bayyinah', number_of_ayahs: 8 },
  { number: 99, name: 'Az-Zalzalah', number_of_ayahs: 8 },
  { number: 100, name: 'Al-Adiyah', number_of_ayahs: 11 },
  { number: 101, name: 'Al-Qariah', number_of_ayahs: 11 },
  { number: 102, name: 'At-Takathur', number_of_ayahs: 8 },
  { number: 103, name: 'Al-Asr', number_of_ayahs: 3 },
  { number: 104, name: 'Al-Humazah', number_of_ayahs: 9 },
  { number: 105, name: 'Al-Fil', number_of_ayahs: 5 },
  { number: 106, name: 'Quraish', number_of_ayahs: 4 },
  { number: 107, name: 'Al-Maun', number_of_ayahs: 7 },
  { number: 108, name: 'Al-Kawthar', number_of_ayahs: 3 },
  { number: 109, name: 'Al-Kafirun', number_of_ayahs: 6 },
  { number: 110, name: 'An-Nasr', number_of_ayahs: 3 },
  { number: 111, name: 'Al-Masad', number_of_ayahs: 5 },
  { number: 112, name: 'Al-Ikhlas', number_of_ayahs: 4 },
  { number: 113, name: 'Al-Falaq', number_of_ayahs: 5 },
  { number: 114, name: 'An-Nas', number_of_ayahs: 6 },
];

const AyahSelectionScreen = ({ navigation }) => {
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState('1');
  const [ayahNumber, setAyahNumber] = useState('1');
  const [maxAyahs, setMaxAyahs] = useState(7);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState('all'); // 'all' or 'small'

  useEffect(() => {
    const fetchSurahs = async () => {
      const surahData = await supabaseService.getSurahs();
      setSurahs(surahData);
      setLoading(false);
    };
    fetchSurahs();
  }, []);

  useEffect(() => {
    let surah;
    if (selectionMode === 'all') {
      surah = surahs.find(s => s.number.toString() === selectedSurah);
    } else {
      surah = smallSurahs.find(s => s.number.toString() === selectedSurah);
    }
    if (surah) {
      setMaxAyahs(surah.number_of_ayahs);
      if (parseInt(ayahNumber) > surah.number_of_ayahs) {
        setAyahNumber('1');
      }
    }
  }, [selectedSurah, surahs, selectionMode, ayahNumber]);

  const handleGo = () => {
    navigation.navigate('Memorization', {
      surah: parseInt(selectedSurah),
      ayah: parseInt(ayahNumber),
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  const currentSurahList = selectionMode === 'all' ? surahs : smallSurahs;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Ayah</Text>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, selectionMode === 'all' && styles.activeMode]}
          onPress={() => setSelectionMode('all')}
        >
          <Text style={styles.modeText}>All Surahs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, selectionMode === 'small' && styles.activeMode]}
          onPress={() => setSelectionMode('small')}
        >
          <Text style={styles.modeText}>Small Surahs</Text>
        </TouchableOpacity>
      </View>

      <Picker
        selectedValue={selectedSurah}
        style={styles.picker}
        onValueChange={(itemValue) => setSelectedSurah(itemValue)}
        dropdownIconColor="#fff"
      >
        {currentSurahList.map((surah) => (
          <Picker.Item
            key={surah.number}
            label={`${surah.number}. ${surah.name || surah.english_name}`}
            value={surah.number.toString()}
            color="#000"
          />
        ))}
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Ayah Number"
        placeholderTextColor="#888"
        keyboardType="number-pad"
        value={ayahNumber}
        onChangeText={setAyahNumber}
      />
      <Text style={styles.maxAyahText}>Max Ayahs: {maxAyahs}</Text>

      <TouchableOpacity style={styles.button} onPress={handleGo}>
        <Text style={styles.buttonText}>Go</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeMode: {
    backgroundColor: '#22c55e',
  },
  modeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  picker: {
    width: '100%',
    height: 50,
    color: 'white',
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  maxAyahText: {
    color: '#888',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AyahSelectionScreen;
