
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

export interface GoogleAuthResult {
  idToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    photo?: string;
  };
  serverAuthCode?: string;
}

// Configure WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession();

class GoogleAuthManager {
  private static instance: GoogleAuthManager;
  private isConfigured = false;
  private clientId = '973872870030-pd8o0fdototnb2ouuinr3udcjptqrtg8.apps.googleusercontent.com';

  static getInstance(): GoogleAuthManager {
    if (!GoogleAuthManager.instance) {
      GoogleAuthManager.instance = new GoogleAuthManager();
    }
    return GoogleAuthManager.instance;
  }

  async configure(): Promise<void> {
    if (this.isConfigured) return;
    this.isConfigured = true;
  }

  async signIn(): Promise<GoogleAuthResult> {
    try {
      await this.configure();

      // Use Expo's auth proxy which provides HTTPS redirect URIs
      const redirectUri = 'https://auth.expo.io/@kosaija/paycrypt';

      const request = new AuthSession.AuthRequest({
        clientId: this.clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken,
        usePKCE: false,
        extraParams: {
          nonce: Math.random().toString(36).substring(7),
        },
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success' && result.params?.id_token) {
        // Decode the ID token to get user info
        const payload = JSON.parse(atob(result.params.id_token.split('.')[1]));
        
        return {
          idToken: result.params.id_token,
          user: {
            id: payload.sub,
            email: payload.email,
            name: payload.name || '',
            photo: payload.picture || undefined,
          },
        };
      } else {
        throw new Error('Authentication was cancelled or failed');
      }
    } catch (error: any) {
      throw new Error(`Google Sign-In failed: ${error.message}`);
    }
  }

  async signOut(): Promise<void> {
    // For web-based auth, we just clear any stored tokens
    console.log('Signed out');
  }

  async isSignedIn(): Promise<boolean> {
    // For web-based auth, we can't easily check sign-in status
    return false;
  }

  async getCurrentUser() {
    // For web-based auth, we can't easily get current user
    return null;
  }
}

export default GoogleAuthManager;
