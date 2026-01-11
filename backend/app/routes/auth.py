"""OAuth authentication endpoints."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/callback")
async def oauth_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    """
    OAuth callback endpoint for Zitadel.

    Note: For client-side OAuth flow (PKCE), this endpoint may not be needed
    if using @zitadel/react SDK which handles OAuth in the browser.
    """
    if error:
        return {"error": error}

    # For client-side OAuth, the frontend handles the callback
    # This endpoint can be used for server-side token exchange if needed
    return {"message": "OAuth callback received", "code": code, "state": state}

