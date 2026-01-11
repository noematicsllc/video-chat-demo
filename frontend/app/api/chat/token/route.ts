/** API route to generate chat server JWT tokens. */

import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { v5 as uuidv5 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || '';
const CHAT_WS_URL = process.env.CHAT_WS_URL || 'ws://localhost:4000/socket';
const ZITADEL_ISSUER_URL = process.env.ZITADEL_ISSUER_URL || '';
const ZITADEL_CLIENT_ID = process.env.ZITADEL_CLIENT_ID || '';
const REQUIRE_AUTH = process.env.REQUIRE_AUTH !== 'false'; // Default to true
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'RS256';

// URL namespace UUID for deterministic UUID v5 generation from user IDs
const USER_ID_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

/**
 * Convert a user ID to a UUID format.
 * If the user ID is already a valid UUID, returns it as-is.
 * Otherwise, generates a deterministic UUID v5 from the user ID.
 */
function userIdToUUID(userId: string): string {
  // Check if it's already a valid UUID format (8-4-4-4-12 hex digits)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(userId)) {
    return userId;
  }
  
  // Generate a deterministic UUID v5 from the user ID
  return uuidv5(userId, USER_ID_NAMESPACE);
}

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
 * Generate HS256 JWT token for chat server authentication.
 */
async function generateChatToken(userId: string, expiresInHours: number = 24): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInHours * 3600;

  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(secret);

  return token;
}

export async function GET(request: NextRequest) {
  try {
    // Get and verify JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    let user: jose.JWTPayload;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      user = await verifyToken(token);
    } else if (!REQUIRE_AUTH) {
      // Allow unauthenticated requests if auth is disabled
      user = {
        sub: 'mock-user',
        preferred_username: 'mock-user',
        name: 'Mock User',
      };
    } else {
      return NextResponse.json(
        { detail: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract user ID (sub) from Zitadel token
    const rawUserId = user.sub as string;
    if (!rawUserId) {
      return NextResponse.json(
        { detail: 'User ID not found in token' },
        { status: 400 }
      );
    }

    // Convert user ID to UUID format (chat server expects UUID)
    const userId = userIdToUUID(rawUserId);

    // Generate chat token
    const chatToken = await generateChatToken(userId);

    return NextResponse.json({
      token: chatToken,
      ws_url: CHAT_WS_URL,
    });
  } catch (error) {
    console.error('Error generating chat token:', error);

    if (error instanceof Error) {
      // Check if it's an authentication error
      if (error.message.includes('Token') || error.message.includes('token')) {
        return NextResponse.json(
          { detail: error.message },
          { status: 401 }
        );
      }

      // Check if it's a configuration error
      if (error.message.includes('not configured')) {
        return NextResponse.json(
          { detail: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { detail: 'Failed to generate chat token' },
      { status: 500 }
    );
  }
}

