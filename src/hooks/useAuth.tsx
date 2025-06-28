import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import AuthTokenHandler from '@/utils/authTokenHandler';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize secure token handling on app load
    const initializeAuth = async () => {
      try {
        // Handle OAuth tokens securely
        const tokenData = AuthTokenHandler.initializeSecureHandling();
        
        if (tokenData?.access_token) {
          // Set the session with the parsed tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || ''
          });
          
          if (error) {
            console.error('Error setting session:', error);
            AuthTokenHandler.clearStoredTokens();
          } else {
            setUser(data.session?.user ?? null);
          }
        } else {
          // Get initial session normally
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        AuthTokenHandler.clearStoredTokens();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Clear stored tokens on sign out
        if (event === 'SIGNED_OUT') {
          AuthTokenHandler.clearStoredTokens();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Clear stored tokens before signing out
      AuthTokenHandler.clearStoredTokens();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    signOut,
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