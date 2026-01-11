# LiveKit Video Chat Application

A full-featured video chat application built with FastAPI backend, React frontend, Zitadel authentication, and external LiveKit server integration.

## Architecture

- **Backend**: FastAPI (Python 3.13+) with Zitadel OAuth authentication
- **Frontend**: React + TypeScript + Vite
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

- Python 3.13+
- Node.js 20+
- uv (Python package manager)
- Zitadel instance configured
- LiveKit server (external)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
uv sync
# or
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the backend:
```bash
uvicorn app.main:app --reload
# or
uv run uvicorn app.main:app --reload
```

Backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Environment Variables

### Backend (.env)

```env
# Zitadel OAuth Configuration
ZITADEL_ISSUER_URL=https://your-zitadel-instance.com
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_CLIENT_SECRET=your-client-secret

# LiveKit Configuration
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
LIVEKIT_SERVER_URL=wss://your-livekit-server.com

# Backend Configuration
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
REQUIRE_AUTH=true  # Set to false to disable authentication (development only)

# JWT Configuration
JWT_ALGORITHM=RS256
```

### Frontend (.env)

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:8000

# Zitadel OAuth Configuration
VITE_ZITADEL_ISSUER_URL=https://your-zitadel-instance.com
VITE_ZITADEL_CLIENT_ID=your-client-id
```

## Deployment with Coolify

### Using Dockerfile

1. Add the repository to Coolify as a new application
2. Coolify will automatically detect the Dockerfile
3. Configure environment variables in Coolify's environment section:

**Backend Environment Variables:**
```
ZITADEL_ISSUER_URL=https://your-zitadel-instance.com
ZITADEL_CLIENT_ID=your-client-id
ZITADEL_CLIENT_SECRET=your-client-secret
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
LIVEKIT_SERVER_URL=wss://your-livekit-server.com
BACKEND_URL=https://your-domain.com
CORS_ORIGINS=https://your-domain.com
REQUIRE_AUTH=true  # Set to false to disable authentication (development only)
JWT_ALGORITHM=RS256
```

**Important Notes:**
- Update `BACKEND_URL` to your deployed backend URL
- Update `CORS_ORIGINS` to include your frontend domain
- The Dockerfile builds both frontend and backend in a single container
- Frontend static files are served by FastAPI
- Coolify's built-in proxy handles routing

4. Deploy!

The application will be available on the domain configured in Coolify.

### Health Check

The backend includes a health check endpoint at `/health` that Coolify can use for monitoring.

## Project Structure

```
video-chat-demo/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration
│   │   ├── auth.py              # Zitadel authentication
│   │   ├── livekit_service.py   # LiveKit token generation
│   │   ├── models.py            # Pydantic models
│   │   └── routes/              # API routes
│   ├── requirements.txt
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks
│   │   ├── services/            # API client
│   │   └── utils/               # Utilities
│   └── package.json
├── Dockerfile                   # Single container build
└── README.md
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/rooms` - List rooms (requires auth)
- `GET /api/rooms/{name}` - Get room info (requires auth)
- `POST /api/tokens` - Generate LiveKit token (requires auth)
- `GET /api/auth/callback` - OAuth callback

## License

MIT
