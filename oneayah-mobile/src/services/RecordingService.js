import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

class RecordingService {
  constructor() {
    this.recording = null;
    this.sound = null;
    this.recordingSettings = Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY;
  }

  async startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(this.recordingSettings);
      this.recording = recording;
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async stopRecording() {
    if (!this.recording) {
      return;
    }

    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI();
    this.recording = null;
    return uri;
  }

  async playRecording(uri) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      this.sound = sound;
      await this.sound.playAsync();
    } catch (error) {
      console.error('Failed to play recording', error);
    }
  }

  async saveRecording(uri, surah, ayah) {
    const fileName = `recording-${surah}-${ayah}.caf`;
    const newUri = FileSystem.documentDirectory + fileName;

    try {
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });
      return newUri;
    } catch (error) {
      console.error('Failed to save recording', error);
      return null;
    }
  }

  async getRecording(surah, ayah) {
    const fileName = `recording-${surah}-${ayah}.caf`;
    const uri = FileSystem.documentDirectory + fileName;

    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        return uri;
      }
      return null;
    } catch (error) {
      console.error('Failed to get recording', error);
      return null;
    }
  }
}

export const recordingService = new RecordingService();
