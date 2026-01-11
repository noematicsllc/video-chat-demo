# LiveKit Video Chat Application

A full-featured video chat application built with Next.js, Zitadel authentication, and external LiveKit server integration.

## Architecture

- **Frontend & API**: Next.js (React + TypeScript) with server-side API routes
- **Authentication**: Zitadel identity provider
- **Video/Audio**: LiveKit server (external)

## Features

- Minimal options page for LiveKit server configuration
- Zitadel OAuth authentication
- Real-time video and audio chat
- Join/leave rooms
- Audio/video controls (mute/unmute, camera on/off)
- Responsive UI

## Development Setup

### Prerequisites

- Node.js 20+
- Zitadel instance configured
- LiveKit server (external)

### Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
# Copy from example if available, or create new
```

4. Configure environment variables (see Environment Variables section below)

5. Run the development server:
```bash
npm run dev
```

The application will run on `http://localhost:3000`

## Environment Variables

### Frontend (.env.local)

**Note:** Next.js uses `.env.local` for local development (not committed to git).

```env
# Zitadel OAuth Configuration (client-side)
NEXT_PUBLIC_ZITADEL_ISSUER_URL=https://your-zitadel-instance.com
NEXT_PUBLIC_ZITADEL_CLIENT_ID=your-client-id

# Zitadel OAuth Configuration (server-side - for API routes)
ZITADEL_ISSUER_URL=https://your-zitadel-instance.com
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_CLIENT_SECRET=your-client-secret

# LiveKit Configuration (server-side only)
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
LIVEKIT_SERVER_URL=wss://your-livekit-server.com

# Authentication Configuration (server-side)
REQUIRE_AUTH=true  # Set to false to disable authentication (development only)
JWT_ALGORITHM=RS256
```

**Important:** 
- Next.js requires the `NEXT_PUBLIC_` prefix for client-side environment variables
- Server-side variables (without `NEXT_PUBLIC_`) are only available in API routes and server components
- Never expose `LIVEKIT_API_SECRET` or `ZITADEL_CLIENT_SECRET` to the client

## Deployment with Coolify

### Using Dockerfile

1. Add the repository to Coolify as a new application
2. Coolify will automatically detect the Dockerfile
3. Configure environment variables in Coolify's environment section:

**All Environment Variables (set in Coolify):**

```
# Zitadel OAuth Configuration
# Client-side (needs NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_ZITADEL_ISSUER_URL=https://auth.bannerhmk.com
NEXT_PUBLIC_ZITADEL_CLIENT_ID=your-client-id

# Server-side (no prefix)
ZITADEL_ISSUER_URL=https://auth.bannerhmk.com
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_CLIENT_SECRET=your-client-secret

# LiveKit Configuration (server-side only)
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

**Important Notes:**
- Replace `https://your-domain.com` with your actual Coolify domain
- **Zitadel values**: Set both `ZITADEL_*` (server-side) and `NEXT_PUBLIC_ZITADEL_*` (client-side) to the same values
- The Dockerfile builds and runs Next.js only (single container)
- Next.js runs on port 3000
- Coolify's reverse proxy will route traffic to port 3000

4. Deploy!

The application will be available on the domain configured in Coolify.

### Health Check

Next.js includes built-in health monitoring. The root endpoint `/` can be used for health checks.

## Project Structure

```
video-chat-demo/
├── frontend/
│   ├── app/
│   │   ├── api/                    # Next.js API routes
│   │   │   ├── auth/               # OAuth token exchange
│   │   │   └── tokens/             # LiveKit token generation
│   │   ├── components/             # React components
│   │   ├── hooks/                  # Custom hooks
│   │   ├── lib/                    # Utilities and API client
│   │   └── page.tsx                # Main page
│   └── package.json
├── Dockerfile                      # Single container build
└── README.md
```

## API Endpoints

- `POST /api/tokens` - Generate LiveKit token (requires auth)
- `POST /api/auth/token` - Exchange OAuth code for JWT token

## License

MIT
