/** Custom hook for Zitadel authentication. */

import { useEffect, useState } from 'react';
import { config } from '../utils/config';

interface User {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );

  useEffect(() => {
    // Check if we have a token in localStorage
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // Decode token to get user info (basic implementation)
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setUser({
          sub: payload.sub,
          name: payload.name,
          preferred_username: payload.preferred_username,
          email: payload.email,
        });
      } catch (e) {
        console.error('Failed to decode token:', e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = () => {
    // For v1, we'll use a simple OAuth flow
    // In production, use @zitadel/react SDK for proper OAuth2 PKCE flow
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    const authUrl = `${config.zitadelIssuerUrl}/oauth/v2/authorize?` +
      `client_id=${config.zitadelClientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=openid profile email&` +
      `state=${Math.random().toString(36).substring(7)}`;
    
    window.location.href = authUrl;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const setAuthToken = (newToken: string) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      setUser({
        sub: payload.sub,
        name: payload.name,
        preferred_username: payload.preferred_username,
        email: payload.email,
      });
    } catch (e) {
      console.error('Failed to decode token:', e);
    }
  };

  return {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    setAuthToken,
  };
}

