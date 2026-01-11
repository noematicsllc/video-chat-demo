/** API route to exchange OAuth authorization code for token. */

import { NextRequest, NextResponse } from 'next/server';

const ZITADEL_ISSUER_URL = process.env.ZITADEL_ISSUER_URL || '';
const ZITADEL_CLIENT_ID = process.env.ZITADEL_CLIENT_ID || '';
const ZITADEL_CLIENT_SECRET = process.env.ZITADEL_CLIENT_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirectUri } = body;

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'Missing code or redirectUri' },
        { status: 400 }
      );
    }

    if (!ZITADEL_CLIENT_ID) {
      return NextResponse.json(
        { error: 'ZITADEL_CLIENT_ID is not configured' },
        { status: 500 }
      );
    }

    // Exchange authorization code for token
    const tokenUrl = `${ZITADEL_ISSUER_URL}/oauth/v2/token`;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: ZITADEL_CLIENT_ID,
    });

    // Add client_secret if configured (for confidential clients)
    if (ZITADEL_CLIENT_SECRET) {
      params.append('client_secret', ZITADEL_CLIENT_SECRET);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      
      // Parse error response if it's JSON
      let errorMessage = 'Token exchange failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error_description || errorData.error || errorMessage;
      } catch {
        // If not JSON, use the raw text
        errorMessage = errorText || errorMessage;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const tokenData = await response.json();

    // Return the id_token (JWT) which contains user information
    return NextResponse.json({
      token: tokenData.id_token || tokenData.access_token,
    });
  } catch (error) {
    console.error('Error exchanging token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

