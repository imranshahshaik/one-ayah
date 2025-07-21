import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

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

  const signOut = async () => {
    try {
      console.log('🔄 Signing out...');
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔄 Starting Google OAuth...');
      setLoading(true);

      const redirectTo = AuthSession.makeRedirectUri({
        useProxy: true,
        scheme: 'oneayah',
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
        console.error('❌ OAuth error:', error);
        throw error;
      }

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
          {
            showInRecents: false,
            preferEphemeralSession: true,
          }
        );

        if (result.type === 'success') {
          const url = result.url;
          const hashParams = url.split('#')[1];
          const searchParams = url.split('?')[1];
          
          let params;
          if (hashParams) {
            params = new URLSearchParams(hashParams);
          } else if (searchParams) {
            params = new URLSearchParams(searchParams);
          }
          
          if (params) {
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken) {
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (sessionError) throw sessionError;
              
              console.log('✅ OAuth success');
              return { success: true };
            }
          }
        } else if (result.type === 'cancel') {
          console.log('OAuth flow cancelled by user');
          return { success: false, error: 'Sign in was cancelled' };
        }
      }

      throw new Error('OAuth flow failed - no valid response received');
    } catch (error) {
      console.error('❌ OAuth error:', error);
      return { success: false, error: error.message || 'Sign in failed' };
    } finally {
      setLoading(false);
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