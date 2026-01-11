# Coolify Environment Variables

Copy and paste these into Coolify's environment variables section. Replace placeholder values with your actual configuration.

```
# Zitadel OAuth Configuration
# Client-side (needs NEXT_PUBLIC_ prefix for Next.js)
NEXT_PUBLIC_ZITADEL_ISSUER_URL=https://auth.bannerhmk.com
NEXT_PUBLIC_ZITADEL_CLIENT_ID=your-client-id

# Server-side (no prefix - used by API routes)
ZITADEL_ISSUER_URL=https://auth.bannerhmk.com
ZITADEL_CLIENT_ID=your-client-id
# Optional: ZITADEL_CLIENT_SECRET (only needed if Zitadel is configured as a confidential client)

# LiveKit Configuration (server-side only - never expose to client)
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
LIVEKIT_SERVER_URL=wss://your-livekit-server.com

# Authentication Configuration (server-side)
REQUIRE_AUTH=true
JWT_ALGORITHM=RS256

# Next.js Server Configuration
PORT=3000
HOSTNAME=0.0.0.0
NODE_ENV=production
```

## Notes

- Replace `https://your-coolify-domain.com` with your actual Coolify domain (e.g., `https://video-chat.yourdomain.com`)
- The application runs Next.js only (single container on port 3000)
- Coolify will automatically route traffic to port 3000
- **Zitadel values**: Set both `ZITADEL_*` (server-side) and `NEXT_PUBLIC_ZITADEL_*` (client-side) to the same values
- **Security**: Never expose `LIVEKIT_API_SECRET` or `ZITADEL_CLIENT_SECRET` with the `NEXT_PUBLIC_` prefix
- **OAuth Flow**: The current implementation works with public clients (no client secret). If Zitadel is configured as a confidential client, add `ZITADEL_CLIENT_SECRET` and update `/api/auth/token/route.ts` to include it in the token exchange
