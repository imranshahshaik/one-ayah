# OneAyah Mobile

A React Native (Expo) mobile version of the OneAyah Quran memorization app.

## Features

- 📖 Quran reading with Arabic text, translations, and transliterations
- 🎵 Audio playback with repeat functionality using expo-av
- 📚 Memorization tracking with spaced repetition
- 📊 Progress tracking with streaks and achievements
- 🔄 Daily review system
- ⚙️ Customizable settings for reading preferences
- 📱 Optimized mobile UI for Android and iOS

## Tech Stack

- **React Native** with Expo SDK 51
- **Supabase** for backend and authentication
- **expo-av** for audio playback
- **React Navigation** for navigation
- **AsyncStorage** for local storage

## Setup

1. Install dependencies:
   ```bash
   cd oneayah-mobile
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on device:
   ```bash
   # Android
   npm run android
   
   # iOS  
   npm run ios
   ```

## Project Structure

```
oneayah-mobile/
├── App.js                 # Main app component with navigation
├── src/
│   ├── config/
│   │   └── supabase.js   # Supabase client configuration
│   ├── providers/
│   │   ├── AuthProvider.js      # Authentication context
│   │   └── SupabaseProvider.js  # Supabase context
│   └── screens/
│       ├── HomeScreen.js        # Dashboard and overview
│       ├── MemorizationScreen.js # Main memorization interface
│       ├── ProgressScreen.js    # Progress tracking and stats
│       └── SettingsScreen.js    # App settings and preferences
├── assets/               # Images and other static assets
└── package.json
```

## Key Components

### Authentication
- Uses Supabase Auth with AsyncStorage for session persistence
- Automatic session management and token refresh

### Audio System
- Built with expo-av for native audio playback
- Supports repeat modes with configurable counts
- Audio URL construction for different reciters

### Data Management
- Real-time sync with Supabase database
- Offline-capable with local storage
- Spaced repetition algorithm for reviews

## Development Notes

This mobile app is a separate implementation from the web version, designed specifically for mobile devices with:
- Touch-optimized interface
- Native audio controls
- Mobile-specific navigation patterns
- Responsive design for various screen sizes

The app maintains feature parity with the web version while providing a native mobile experience.