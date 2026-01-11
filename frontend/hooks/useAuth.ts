/** Custom hook for Zitadel authentication. */

'use client';

import { useEffect, useState } from 'react';
import {
  storeToken,
  getToken,
  clearToken,
  decodeToken,
  getUserFromToken,
  type User,
} from '@/lib/auth';

const ZITADEL_ISSUER_URL =
  process.env.NEXT_PUBLIC_ZITADEL_ISSUER_URL || '';
const ZITADEL_CLIENT_ID =
  process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID || '';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Check if Zitadel is configured
  const hasZitadelConfig = !!(ZITADEL_ISSUER_URL && ZITADEL_CLIENT_ID);

  useEffect(() => {
    const initializeAuth = () => {
      // Check if we have a token in localStorage
      const storedToken = getToken();
      if (storedToken) {
        setToken(storedToken);
        const decodedUser = decodeToken(storedToken);
        if (decodedUser) {
          setUser(decodedUser);
        } else {
          // Clear invalid token
          clearToken();
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = () => {
    // If Zitadel is not configured, do nothing
    if (!hasZitadelConfig) {
      console.warn('Zitadel is not configured');
      return;
    }

    // OAuth2 Authorization Code flow
    const redirectUri = encodeURIComponent(
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : ''
    );
    const state = Math.random().toString(36).substring(7);
    
    // Store state for validation (optional, for production use)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_state', state);
    }

    const authUrl = `${ZITADEL_ISSUER_URL}/oauth/v2/authorize?` +
      `client_id=${ZITADEL_CLIENT_ID}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=openid profile email&` +
      `state=${state}`;

    if (typeof window !== 'undefined') {
      window.location.href = authUrl;
    }
  };

  const logout = () => {
    clearToken();
    setToken(null);
    setUser(null);
  };

  const setAuthToken = (newToken: string) => {
    storeToken(newToken);
    setToken(newToken);
    const decodedUser = decodeToken(newToken);
    if (decodedUser) {
      setUser(decodedUser);
    }
  };

  return {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    setAuthToken,
  };
}

