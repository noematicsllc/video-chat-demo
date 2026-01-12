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

/**
 * Create a JWT token for chat server authentication.
 * This token is used to authenticate with the Elixir/Phoenix chat server.
 * 
 * @param userId - The user ID (must be a UUID string)
 * @returns JWT token string
 */
export function createChatToken(userId: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET!;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  // This payload matches EXACTLY what we coded in Elixir's Token.verify_and_validate
  const payload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

