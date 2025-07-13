import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getOAuthUrl } from '../config/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (mounted) {
          if (initialSession && !error) {
            console.log('✅ Found existing session:', initialSession.user.email);
            setSession(initialSession);
            setUser(initialSession.user);
          } else {
            console.log('ℹ️ No existing session found');
          }
          setIsInitialized(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setIsInitialized(true);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (!isInitialized) {
            setIsInitialized(true);
            setLoading(false);
          }
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('🔄 Starting Google OAuth...');
      setLoading(true);

      const url = await getOAuthUrl();
      console.log('🔗 Opening OAuth URL:', url);

      const result = await WebBrowser.openAuthSessionAsync(
        url,
        AuthSession.makeRedirectUri({ useProxy: true }),
        {
          showInRecents: true,
        }
      );

      console.log('📱 OAuth result:', result);

      if (result.type === 'success') {
        const { url: resultUrl } = result;
        
        // Extract tokens from URL
        const urlParams = new URLSearchParams(resultUrl.split('#')[1] || resultUrl.split('?')[1]);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');

        if (accessToken) {
          console.log('✅ OAuth tokens received, setting session...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('❌ Error setting session:', error);
            throw error;
          }

          console.log('✅ Session set successfully:', data.user.email);
          return { success: true };
        } else {
          throw new Error('No access token received');
        }
      } else if (result.type === 'cancel') {
        console.log('ℹ️ OAuth cancelled by user');
        return { success: false, error: 'Authentication cancelled' };
      } else {
        throw new Error('OAuth failed');
      }
    } catch (error) {
      console.error('❌ OAuth error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 Signing out...');
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    isInitialized,
    signInWithGoogle,
    signOut,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};