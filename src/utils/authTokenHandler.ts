/**
 * Secure OAuth token handler for Supabase authentication
 * Handles token parsing, secure storage, and URL cleanup
 */

interface TokenData {
  access_token?: string;
  refresh_token?: string;
  expires_in?: string;
  token_type?: string;
}

class AuthTokenHandler {
  private static readonly TOKEN_STORAGE_KEY = 'supabase_auth_tokens';
  private static readonly TOKEN_EXPIRY_KEY = 'supabase_auth_expiry';

  /**
   * Parse tokens from URL hash and immediately clean the URL
   */
  static parseAndCleanTokens(): TokenData | null {
    try {
      const hash = window.location.hash;
      
      if (!hash || !hash.includes('access_token')) {
        return null;
      }

      // Parse the hash parameters
      const params = new URLSearchParams(hash.substring(1));
      const tokenData: TokenData = {};

      // Extract tokens
      if (params.has('access_token')) {
        tokenData.access_token = params.get('access_token')!;
      }
      if (params.has('refresh_token')) {
        tokenData.refresh_token = params.get('refresh_token')!;
      }
      if (params.has('expires_in')) {
        tokenData.expires_in = params.get('expires_in')!;
      }
      if (params.has('token_type')) {
        tokenData.token_type = params.get('token_type')!;
      }

      // Immediately clean the URL to prevent token exposure
      this.cleanUrl();

      return tokenData;
    } catch (error) {
      console.error('Error parsing OAuth tokens:', error);
      this.cleanUrl(); // Clean URL even on error
      return null;
    }
  }

  /**
   * Clean the URL of any OAuth tokens using history.replaceState
   */
  static cleanUrl(): void {
    try {
      // Remove hash completely and replace current history entry
      history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (error) {
      console.error('Error cleaning URL:', error);
    }
  }

  /**
   * Securely store tokens with expiration
   */
  static storeTokens(tokenData: TokenData): void {
    try {
      if (!tokenData.access_token) return;

      // Calculate expiration time
      const expiresIn = parseInt(tokenData.expires_in || '3600', 10);
      const expiryTime = Date.now() + (expiresIn * 1000);

      // Store tokens in sessionStorage (more secure than localStorage for auth tokens)
      sessionStorage.setItem(this.TOKEN_STORAGE_KEY, JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type || 'bearer'
      }));

      sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  /**
   * Retrieve stored tokens if they haven't expired
   */
  static getStoredTokens(): TokenData | null {
    try {
      const expiryTime = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
      
      if (!expiryTime || Date.now() > parseInt(expiryTime, 10)) {
        // Tokens expired, clean up
        this.clearStoredTokens();
        return null;
      }

      const tokensJson = sessionStorage.getItem(this.TOKEN_STORAGE_KEY);
      if (!tokensJson) return null;

      return JSON.parse(tokensJson);
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
   * Initialize secure token handling on app load
   */
  static initializeSecureHandling(): TokenData | null {
    // Parse tokens from URL and clean immediately
    const tokenData = this.parseAndCleanTokens();
    
    if (tokenData) {
      // Store tokens securely
      this.storeTokens(tokenData);
      return tokenData;
    }

    // Check for existing stored tokens
    return this.getStoredTokens();
  }
}

export default AuthTokenHandler;