"""LiveKit token generation endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import GetCurrentUser
from app.config import settings
from app.livekit_service import generate_access_token
from app.models import TokenRequest, TokenResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tokens", tags=["tokens"])


@router.post("", response_model=TokenResponse)
async def create_token(
    request: TokenRequest,
    current_user: GetCurrentUser,
):
    """
    Generate a LiveKit access token for the authenticated user.

    Requires authentication via Bearer token (or mock user if REQUIRE_AUTH=false).
    """
    try:
        # Extract user identity from token (use 'sub' or 'preferred_username')
        participant_identity = current_user.get("sub") or current_user.get(
            "preferred_username", "unknown"
        )
        participant_name = (
            request.participant_name
            or current_user.get("name")
            or current_user.get("preferred_username")
            or participant_identity
        )

        logger.info(
            f"Generating token for room={request.room_name}, "
            f"identity={participant_identity}, name={participant_name}"
        )

        # Generate LiveKit access token
        token = generate_access_token(
            room_name=request.room_name,
            participant_identity=participant_identity,
            participant_name=participant_name,
        )

        return TokenResponse(token=token, url=settings.livekit_server_url)

    except ValueError as e:
        logger.error(f"Validation error generating token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request: {str(e)}",
        )
    except Exception as e:
        logger.exception(f"Failed to generate token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate token: {str(e)}",
        )

