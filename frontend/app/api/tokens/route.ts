/** API route to generate LiveKit access tokens. */

import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';
import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const LIVEKIT_SERVER_URL = process.env.LIVEKIT_SERVER_URL || 'wss://your-livekit-server.com';
const ZITADEL_ISSUER_URL = process.env.ZITADEL_ISSUER_URL || '';
const ZITADEL_CLIENT_ID = process.env.ZITADEL_CLIENT_ID || '';
const REQUIRE_AUTH = process.env.REQUIRE_AUTH !== 'false'; // Default to true
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'RS256';

interface TokenRequest {
  room_name: string;
  participant_name?: string;
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
  const JWKS = jose.createRemoteJWKSet(
    new URL(`${ZITADEL_ISSUER_URL}/.well-known/jwks.json`)
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
 * Generate LiveKit access token.
 */
async function generateLiveKitToken(
  roomName: string,
  participantIdentity: string,
  participantName?: string
): Promise<string> {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error('LiveKit API credentials are not configured');
  }

  if (!roomName) {
    throw new Error('room_name cannot be empty');
  }

  if (!participantIdentity) {
    throw new Error('participant_identity cannot be empty');
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
  });

  if (participantName) {
    at.name = participantName;
  }

  const videoGrant: VideoGrant = {
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  };

  at.addGrant(videoGrant);

  return await at.toJwt();
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: TokenRequest = await request.json();
    const { room_name, participant_name } = body;

    if (!room_name) {
      return NextResponse.json(
        { detail: 'room_name is required' },
        { status: 400 }
      );
    }

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

    // Extract user identity
    const baseIdentity = (user.sub as string) || (user.preferred_username as string) || 'user';
    
    // Add random UUID suffix to ensure unique identity for each token request
    const randomSuffix = uuidv4().substring(0, 8);
    const participantIdentity = `${baseIdentity}-${randomSuffix}`;

    const finalParticipantName =
      participant_name ||
      (user.name as string) ||
      (user.preferred_username as string) ||
      baseIdentity;

    // Generate LiveKit token
    const token = await generateLiveKitToken(
      room_name,
      participantIdentity,
      finalParticipantName
    );

    return NextResponse.json({
      token,
      url: LIVEKIT_SERVER_URL,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    
    if (error instanceof Error) {
      // Check if it's an authentication error
      if (error.message.includes('Token') || error.message.includes('token')) {
        return NextResponse.json(
          { detail: error.message },
          { status: 401 }
        );
      }
      
      // Check if it's a validation error
      if (error.message.includes('required') || error.message.includes('cannot be empty')) {
        return NextResponse.json(
          { detail: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { detail: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

