export interface Recording {
  id: string;
  surah: number;
  ayah: number;
  audioBlob: Blob;
  duration: number;
  createdAt: Date;
}

export interface RecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
}

class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordings: Map<string, Recording> = new Map();
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.loadRecordings();
  }

  private getRecordingKey(surah: number, ayah: number): string {
    return `${surah}:${ayah}`;
  }

  private loadRecordings(): void {
    try {
      const stored = localStorage.getItem('oneayah_recordings');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          // Convert base64 back to blob
          const byteCharacters = atob(value.audioData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'audio/webm' });

          this.recordings.set(key, {
            id: value.id,
            surah: value.surah,
            ayah: value.ayah,
            audioBlob: blob,
            duration: value.duration,
            createdAt: new Date(value.createdAt)
          });
        });
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  }

  private saveRecordings(): void {
    try {
      const data: any = {};
      this.recordings.forEach((recording, key) => {
        // Convert blob to base64 for storage
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          data[key] = {
            id: recording.id,
            surah: recording.surah,
            ayah: recording.ayah,
            audioData: base64,
            duration: recording.duration,
            createdAt: recording.createdAt.toISOString()
          };
          localStorage.setItem('oneayah_recordings', JSON.stringify(data));
        };
        reader.readAsDataURL(recording.audioBlob);
      });
    } catch (error) {
      console.error('Error saving recordings:', error);
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  async stopRecording(surah: number, ayah: number): Promise<Recording | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const recording: Recording = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          surah,
          ayah,
          audioBlob,
          duration: 0, // Will be calculated when played
          createdAt: new Date()
        };

        const key = this.getRecordingKey(surah, ayah);
        this.recordings.set(key, recording);
        this.saveRecordings();

        // Stop all tracks
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
        resolve(recording);
      };

      this.mediaRecorder.stop();
    });
  }

  getRecording(surah: number, ayah: number): Recording | null {
    const key = this.getRecordingKey(surah, ayah);
    return this.recordings.get(key) || null;
  }

  async playRecording(recording: Recording): Promise<HTMLAudioElement> {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }

    const audioUrl = URL.createObjectURL(recording.audioBlob);
    this.currentAudio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      if (!this.currentAudio) {
        reject(new Error('Failed to create audio element'));
        return;
      }

      this.currentAudio.onloadedmetadata = () => {
        resolve(this.currentAudio!);
      };

      this.currentAudio.onerror = () => {
        reject(new Error('Failed to load recording'));
      };
    });
  }

  deleteRecording(surah: number, ayah: number): boolean {
    const key = this.getRecordingKey(surah, ayah);
    const deleted = this.recordings.delete(key);
    if (deleted) {
      this.saveRecordings();
    }
    return deleted;
  }

  getAllRecordings(): Recording[] {
    return Array.from(this.recordings.values());
  }

  stopCurrentPlayback(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
  }
}

export const recordingService = new RecordingService();