/** Authentication utilities for Zitadel OAuth. */

export interface User {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
}

const AUTH_TOKEN_KEY = 'auth_token';

/**
 * Store authentication token in localStorage.
 */
export function storeToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

/**
 * Retrieve authentication token from localStorage.
 */
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

/**
 * Remove authentication token from localStorage.
 */
export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

/**
 * Decode JWT token to extract user information.
 */
export function decodeToken(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      sub: payload.sub,
      name: payload.name,
      preferred_username: payload.preferred_username,
      email: payload.email,
    };
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
}

/**
 * Get user information from stored token.
 */
export function getUserFromToken(): User | null {
  const token = getToken();
  if (!token) {
    return null;
  }
  return decodeToken(token);
}

