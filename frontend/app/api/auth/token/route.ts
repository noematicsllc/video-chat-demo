/** API route to exchange OAuth authorization code for token. */

import { NextRequest, NextResponse } from 'next/server';

const ZITADEL_ISSUER_URL = process.env.ZITADEL_ISSUER_URL || '';
const ZITADEL_CLIENT_ID = process.env.ZITADEL_CLIENT_ID || '';

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

    // Exchange authorization code for token
    const tokenUrl = `${ZITADEL_ISSUER_URL}/oauth/v2/token`;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: ZITADEL_CLIENT_ID,
    });

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
      return NextResponse.json(
        { error: 'Token exchange failed' },
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

