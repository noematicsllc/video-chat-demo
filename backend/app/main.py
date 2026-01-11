"""FastAPI application entry point."""

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.routes import auth, rooms, tokens

app = FastAPI(
    title="LiveKit Video Chat API",
    description="Backend API for LiveKit video chat application",
    version="0.1.0",
)

# Configure CORS
# Parse CORS origins from comma-separated string or list
cors_origins_list = (
    settings.cors_origins.split(",") if isinstance(settings.cors_origins, str)
    else settings.cors_origins
)
cors_origins_list = [origin.strip() for origin in cors_origins_list]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(tokens.router)
app.include_router(rooms.router)
app.include_router(auth.router)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


# Serve static files from frontend/dist if it exists
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    # Mount static assets
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    
    @app.get("/")
    async def root():
        """Serve frontend index.html."""
        return FileResponse(str(frontend_dist / "index.html"))
    
    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        """Serve frontend routes (SPA fallback)."""
        # Skip if it's an API route (already handled by routers above)
        if path.startswith("api") or path == "health":
            return {"error": "Not found"}
        
        file_path = frontend_dist / path
        if file_path.exists() and file_path.is_file() and file_path.is_relative_to(frontend_dist):
            return FileResponse(str(file_path))
        
        # For SPA routing, serve index.html for all non-API routes
        return FileResponse(str(frontend_dist / "index.html"))
else:
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {"message": "LiveKit Video Chat API", "version": "0.1.0"}

