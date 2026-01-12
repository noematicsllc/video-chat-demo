/** Server-side authentication utilities for Next.js server components. */

import * as jose from 'jose';
import { cookies } from 'next/headers';

const ZITADEL_ISSUER_URL = process.env.ZITADEL_ISSUER_URL || '';
const ZITADEL_CLIENT_ID = process.env.ZITADEL_CLIENT_ID || '';
const REQUIRE_AUTH = process.env.REQUIRE_AUTH !== 'false'; // Default to true
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'RS256';

/**
 * Verify JWT token from Zitadel using JWKS.
 */
async function verifyToken(token: string): Promise<jose.JWTPayload> {
  if (!REQUIRE_AUTH) {
    // Return mock user if auth is disabled
    return {
      sub: 'mock-user',
      preferred_username: 'mock-user',
      name: 'Mock User',
    };
  }

  if (!ZITADEL_ISSUER_URL) {
    throw new Error('ZITADEL_ISSUER_URL is not configured');
  }

  // Create remote JWKS for token verification
  // Zitadel uses /oauth/v2/keys for JWKS (not /.well-known/jwks.json)
  const JWKS = jose.createRemoteJWKSet(
    new URL(`${ZITADEL_ISSUER_URL}/oauth/v2/keys`)
  );

  try {
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: ZITADEL_ISSUER_URL,
      audience: ZITADEL_CLIENT_ID,
      algorithms: [JWT_ALGORITHM as string],
    });

    return payload;
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      throw new Error('Token has expired');
    }
    if (error instanceof jose.errors.JWTInvalid) {
      throw new Error('Invalid token');
    }
    throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the current user session from cookies or headers.
 * 
 * This function checks for an auth token in cookies first,
 * then falls back to checking the Authorization header.
 * 
 * Note: In Next.js App Router, server components can access cookies,
 * but not request headers directly. You may need to pass the token
 * via cookies or use middleware to handle authentication.
 * 
 * @returns The user payload or null if not authenticated
 */
export async function getServerSession(): Promise<jose.JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      if (!REQUIRE_AUTH) {
        // Return mock user if auth is disabled
        return {
          sub: 'mock-user',
          preferred_username: 'mock-user',
          name: 'Mock User',
        };
      }
      return null;
    }

    const user = await verifyToken(token);
    return user;
  } catch (error) {
    console.error('Failed to get server session:', error);
    return null;
  }
}

/**
 * Get the current user ID from the server session.
 * 
 * @returns The user ID (sub) or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession();
  if (!session || !session.sub) {
    return null;
  }
  return session.sub as string;
}

