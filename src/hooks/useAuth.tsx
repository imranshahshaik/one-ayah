import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
    const initializeAuth = async () => {
      try {
        // Get the secure OAuth handler from global scope
        const SecureOAuthHandler = (window as any).__SecureOAuthHandler;
        
        if (SecureOAuthHandler) {
          // Check for valid stored tokens
          const storedToken = SecureOAuthHandler.getValidStoredToken();
          const refreshToken = (window as any).__supabase_refresh_token;
          
          if (storedToken?.access_token) {
            console.log('Setting session with stored tokens');
            
            // Set session with stored tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: storedToken.access_token,
              refresh_token: refreshToken || ''
            });
            
            if (error) {
              console.error('Error setting session:', error);
              SecureOAuthHandler.clearStoredTokens();
              
              // Try to get session normally
              const { data: sessionData } = await supabase.auth.getSession();
              setUser(sessionData.session?.user ?? null);
            } else {
              setUser(data.session?.user ?? null);
            }
          } else {
            // No stored tokens, get session normally
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
          }
        } else {
          // Fallback: get session normally
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        
        // Clear any stored tokens on error
        const SecureOAuthHandler = (window as any).__SecureOAuthHandler;
        if (SecureOAuthHandler) {
          SecureOAuthHandler.clearStoredTokens();
        }
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
        
        // Handle token refresh
        if (event === 'TOKEN_REFRESHED' && session) {
          const SecureOAuthHandler = (window as any).__SecureOAuthHandler;
          if (SecureOAuthHandler) {
            // Store new access token
            SecureOAuthHandler.storeTokenSecurely({
              access_token: session.access_token,
              token_type: 'bearer',
              expires_in: '3600' // Default 1 hour
            });
          }
        }
        
        // Clear stored tokens on sign out
        if (event === 'SIGNED_OUT') {
          const SecureOAuthHandler = (window as any).__SecureOAuthHandler;
          if (SecureOAuthHandler) {
            SecureOAuthHandler.clearStoredTokens();
          }
          // Clear any memory tokens
          delete (window as any).__supabase_refresh_token;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Clear stored tokens before signing out
      const SecureOAuthHandler = (window as any).__SecureOAuthHandler;
      if (SecureOAuthHandler) {
        SecureOAuthHandler.clearStoredTokens();
      }
      
      // Clear memory tokens
      delete (window as any).__supabase_refresh_token;
      
      // Sign out from Supabase (invalidates server-side session)
      await supabase.auth.signOut();
      
      // Redirect to login/home page
      window.location.href = '/';
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