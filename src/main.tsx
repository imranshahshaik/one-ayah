import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

/**
 * Production-grade OAuth token handling
 * This runs BEFORE React renders to ensure secure token handling
 */

interface TokenData {
  access_token?: string;
  refresh_token?: string;
  expires_in?: string;
  token_type?: string;
  expires_at?: string;
}

class SecureOAuthHandler {
  private static readonly TOKEN_STORAGE_KEY = 'supabase_auth_token';
  private static readonly TOKEN_EXPIRY_KEY = 'supabase_auth_expiry';

  /**
   * Parse OAuth tokens from URL hash using URLSearchParams
   */
  static parseTokensFromHash(): TokenData | null {
    try {
      const hash = window.location.hash;
      
      if (!hash || !hash.includes('access_token')) {
        return null;
      }

      // Remove the # and parse as URLSearchParams
      const params = new URLSearchParams(hash.substring(1));
      const tokenData: TokenData = {};

      // Extract all OAuth parameters
      if (params.has('access_token')) {
        tokenData.access_token = params.get('access_token')!;
      }
      if (params.has('refresh_token')) {
        tokenData.refresh_token = params.get('refresh_token')!;
      }
      if (params.has('expires_in')) {
        tokenData.expires_in = params.get('expires_in')!;
      }
      if (params.has('expires_at')) {
        tokenData.expires_at = params.get('expires_at')!;
      }
      if (params.has('token_type')) {
        tokenData.token_type = params.get('token_type')!;
      }

      return tokenData;
    } catch (error) {
      console.error('Error parsing OAuth tokens:', error);
      return null;
    }
  }

  /**
   * Immediately clean URL to prevent token exposure
   */
  static cleanUrl(): void {
    try {
      // Use history.replaceState to remove hash completely
      // This prevents tokens from appearing in browser history, referer headers, or shared links
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (error) {
      console.error('Error cleaning URL:', error);
      // Fallback: try to clear hash manually
      try {
        window.location.hash = '';
      } catch (fallbackError) {
        console.error('Fallback URL cleaning failed:', fallbackError);
      }
    }
  }

  /**
   * Store access token and expiration in sessionStorage (never store refresh_token)
   */
  static storeTokenSecurely(tokenData: TokenData): void {
    try {
      if (!tokenData.access_token) return;

      // Calculate expiration time
      let expiryTime: number;
      
      if (tokenData.expires_at) {
        // Use expires_at if provided
        expiryTime = parseInt(tokenData.expires_at, 10) * 1000;
      } else if (tokenData.expires_in) {
        // Calculate from expires_in
        const expiresIn = parseInt(tokenData.expires_in, 10);
        expiryTime = Date.now() + (expiresIn * 1000);
      } else {
        // Default to 1 hour
        expiryTime = Date.now() + (3600 * 1000);
      }

      // Store only access_token and token_type in sessionStorage
      // NEVER store refresh_token in any persistent storage
      const tokenInfo = {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'bearer'
      };

      sessionStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify(tokenInfo));
      sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

    } catch (error) {
      console.error('Error storing tokens securely:', error);
      // Handle incognito/sessionStorage-unavailable cases
      console.warn('SessionStorage unavailable - tokens will not persist');
    }
  }

  /**
   * Get stored token if not expired
   */
  static getValidStoredToken(): { access_token: string; token_type: string } | null {
    try {
      const expiryTime = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
      
      // Check expiration
      if (!expiryTime || Date.now() > parseInt(expiryTime, 10)) {
        this.clearStoredTokens();
        return null;
      }

      const tokenJson = sessionStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (!tokenJson) return null;

      return JSON.parse(tokenJson);
    } catch (error) {
      console.error('Error retrieving stored tokens:', error);
      this.clearStoredTokens();
      return null;
    }
  }

  /**
   * Clear all stored tokens
   */
  static clearStoredTokens(): void {
    try {
      sessionStorage.removeItem(this.TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.error('Error clearing stored tokens:', error);
    }
  }

  /**
   * Decode JWT token to get expiration (backup method)
   */
  static decodeTokenExpiry(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.exp ? decoded.exp * 1000 : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}

/**
 * MAIN SECURE TOKEN HANDLING - Runs before React renders
 */
(function initializeSecureOAuth() {
  try {
    // Step 1: Parse tokens from URL hash
    const tokenData = SecureOAuthHandler.parseTokensFromHash();
    
    // Step 2: IMMEDIATELY clean URL regardless of whether tokens were found
    SecureOAuthHandler.cleanUrl();
    
    // Step 3: If tokens were found, store them securely
    if (tokenData?.access_token) {
      console.log('OAuth tokens detected and being processed securely');
      
      // Store access token securely (never store refresh_token)
      SecureOAuthHandler.storeTokenSecurely(tokenData);
      
      // Store refresh_token only in memory for immediate use if needed
      if (tokenData.refresh_token) {
        // This will be available for Supabase to use immediately but not persisted
        (window as any).__supabase_refresh_token = tokenData.refresh_token;
        
        // Clear it after a short delay to minimize exposure
        setTimeout(() => {
          delete (window as any).__supabase_refresh_token;
        }, 5000);
      }
    }
    
    // Step 4: Check for existing valid tokens
    const existingToken = SecureOAuthHandler.getValidStoredToken();
    if (existingToken) {
      console.log('Valid stored token found');
    }
    
  } catch (error) {
    console.error('Error in secure OAuth initialization:', error);
    // Always clean URL even on error
    SecureOAuthHandler.cleanUrl();
  }
})();

// Make the handler available globally for the auth hook
(window as any).__SecureOAuthHandler = SecureOAuthHandler;

// Now render React app
createRoot(document.getElementById("root")!).render(<App />);