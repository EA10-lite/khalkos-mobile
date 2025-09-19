import { StarknetWalletManager } from '@/src/features/wallet';
import {
  AuthError,
  AuthRequestConfig,
  DiscoveryDocument,
  useAuthRequest
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as jose from 'jose';
import * as React from 'react';
import { Platform } from 'react-native';
import SecureStorage from '../services/SecureStorage';
import { tokenCache } from '../utils/cache';
import { BASE_URL } from '../utils/constants';
import { AuthUser } from '../utils/middleware';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = React.createContext({
  user: null as AuthUser | null,
  signIn: () => {},
  signOut: () => {},
  fetchWithAuth: (url: string, options: RequestInit) =>
    Promise.resolve(new Response()),
  isLoading: false,
  error: null as AuthError | null,
});

const config: AuthRequestConfig = {
  clientId: 'google',
  scopes: ['openid', 'profile', 'email'],
  redirectUri: 'exp://e4a6168ac4ad.ngrok-free.app'
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${BASE_URL}/api/auth/authorize`,
  tokenEndpoint: `${BASE_URL}/api/auth/token`,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState<string | null>(null);
  const [request, response, promptAsync] = useAuthRequest(config, discovery);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<AuthError | null>(null);
  const isWeb = Platform.OS === 'web';
  const refreshInProgressRef = React.useRef(false);
  const walletManager = StarknetWalletManager.getInstance();

  React.useEffect(() => {
    handleResponse();
  }, [response]);

  // Check if user is authenticated
  React.useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const storedAccessToken = await tokenCache?.getToken('accessToken');
        const storedRefreshToken = await tokenCache?.getToken('refreshToken');

        console.log(
          'Restoring session - Access token:',
          storedAccessToken ? 'exists' : 'missing'
        );
        console.log(
          'Restoring session - Refresh token:',
          storedRefreshToken ? 'exists' : 'missing'
        );

        if (storedAccessToken) {
          try {
            const decoded = jose.decodeJwt(storedAccessToken);
            const exp = (decoded as any).exp;
            const now = Math.floor(Date.now() / 1000);

            if (exp && exp > now) {
              setAccessToken(storedAccessToken);

              if (storedRefreshToken) {
                setRefreshToken(storedRefreshToken);
              }

              setUser(decoded as AuthUser);
            } else if (storedRefreshToken) {
              setRefreshToken(storedRefreshToken);
              await refreshAccessToken(storedRefreshToken);
            }
          } catch (e) {
            if (storedRefreshToken) {
              console.log('Error with access token, trying refresh token');
              setRefreshToken(storedRefreshToken);
              await refreshAccessToken(storedRefreshToken);
            }
          }
        } else if (storedRefreshToken) {
          console.log('No access token, using refresh token');
          setRefreshToken(storedRefreshToken);
          await refreshAccessToken(storedRefreshToken);
        } else {
          console.log('User is not authenticated');
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const refreshAccessToken = async (tokenToUse?: string) => {
    if (refreshInProgressRef.current) {
      console.log('Token refresh already in progress, skipping');
      return null;
    }
    refreshInProgressRef.current = true;
    try {
      const currentRefreshToken = tokenToUse || refreshToken;
      if (!currentRefreshToken) {
        console.error('No refresh token available');
        signOut();
        return null;
      }

      const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'native',
          refreshToken: currentRefreshToken,
        }),
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        console.error('Token refresh failed:', errorData);

        if (refreshResponse.status === 401) {
          signOut();
        }
        return null;
      }

      const tokens = await refreshResponse.json();
      const newAccessToken = tokens.accessToken;
      const newRefreshToken = tokens.refreshToken;

      if (newAccessToken) setAccessToken(newAccessToken);
      if (newRefreshToken) setRefreshToken(newRefreshToken);

      if (newAccessToken)
        await tokenCache?.saveToken('accessToken', newAccessToken);
      if (newRefreshToken)
        await tokenCache?.saveToken('refreshToken', newRefreshToken);

      if (newAccessToken) {
        const decoded = jose.decodeJwt(newAccessToken);
        const hasRequiredFields =
          decoded &&
          (decoded as any).name &&
          (decoded as any).email &&
          (decoded as any).picture;

        if (!hasRequiredFields) {
          console.warn('Refreshed token is missing some user fields:', decoded);
        }

        setUser(decoded as AuthUser);
        return newAccessToken;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      signOut();
      return null;
    } finally {
      refreshInProgressRef.current = false;
    }
  };

  const handleNativeTokens = async (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => {
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      tokens;

    if (newAccessToken) setAccessToken(newAccessToken);
    if (newRefreshToken) setRefreshToken(newRefreshToken);

    if (newAccessToken)
      await tokenCache?.saveToken('accessToken', newAccessToken);
    if (newRefreshToken)
      await tokenCache?.saveToken('refreshToken', newRefreshToken);

    if (newAccessToken) {
      const decoded = jose.decodeJwt(newAccessToken);
      setUser(decoded as AuthUser);
    }
  };

  async function handleResponse() {
    if (response?.type === 'success') {
      try {
        setIsLoading(true);
        const { code } = response.params;

        const formData = new FormData();
        formData.append('code', code);

        if (isWeb) {
          formData.append('platform', 'web');
        }

        if (request?.codeVerifier) {
          formData.append('code_verifier', request.codeVerifier);
        } else {
          console.warn('No code verifier found in request object');
        }
        const tokenResponse = await fetch(`${BASE_URL}/api/auth/token`, {
          method: 'POST',
          body: formData,
          credentials: 'same-origin',
        });

        const tokens = await tokenResponse.json();

        if (tokens.idToken) {
          try {
            const walletData = await walletManager.createWalletFromGoogle({
              idToken: tokens.idToken,
            });
            console.log('Starknet wallet created successfully:', {
              address: walletData.address,
              email: walletData.email,
            });

            await handleNativeTokens(tokens);
          } catch (walletError) {
            console.error(`walletError:  ${walletError instanceof Error ? walletError.message : String(walletError)}`);
          }
        }
        
      } catch (e) {
        console.error('Error handling auth response:', e);
      } finally {
        setIsLoading(false);
      }
    } else if (response?.type === 'cancel') {
      alert('Sign in cancelled');
    } else if (response?.type === 'error') {
      setError(response?.error as AuthError);
    }
  }

  const fetchWithAuth = async (url: string, options: RequestInit) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      console.log('API request failed with 401, attempting to refresh token');

      const newToken = await refreshAccessToken();

      if (newToken) {
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
    }

    return response;
  };

  const signIn = async () => {
    console.log('signIn');
    try {
      if (!request) {
        console.log('No request');
        return;
      }

      console.log('request', request);

      setIsLoading(true);
      await promptAsync();
    } catch (e) {
      console.log(e);
      setIsLoading(false);
      throw e;
    }
  };

  const signOut = async () => {
    await tokenCache?.deleteToken('accessToken');
    await tokenCache?.deleteToken('refreshToken');
    await walletManager.logout();
    await SecureStorage.clearAllData();

    // Clear state
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        isLoading,
        error,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
