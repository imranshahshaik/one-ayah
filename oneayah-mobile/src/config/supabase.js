import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL = "https://rwtsadggupulursshdvj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dHNhZGdndXB1bHVyc3NoZHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDY0NDMsImV4cCI6MjA2NjMyMjQ0M30.3vwO5_HPnodxv9Uh0VimBfhiJktZ9NimjgF2VV2ViFI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// OAuth configuration
export const getOAuthUrl = async () => {
  const redirectTo = AuthSession.makeRedirectUri({
    useProxy: true,
  });
  
  console.log('OAuth redirect URL:', redirectTo);
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('OAuth error:', error);
    throw error;
  }

  return data.url;
};