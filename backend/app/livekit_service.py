"""LiveKit token generation service."""

import logging

from livekit import api

from app.config import settings

logger = logging.getLogger(__name__)


def generate_access_token(
    room_name: str,
    participant_identity: str,
    participant_name: str | None = None,
) -> str:
    """
    Generate a LiveKit access token for a participant.

    Args:
        room_name: Name of the room to join
        participant_identity: Unique identifier for the participant
        participant_name: Display name for the participant (optional)

    Returns:
        JWT access token string

    Raises:
        ValueError: If configuration is invalid or parameters are invalid
        Exception: If token generation fails
    """
    # Validate configuration
    if not settings.livekit_api_key:
        raise ValueError("LIVEKIT_API_KEY is not configured")
    if not settings.livekit_api_secret:
        raise ValueError("LIVEKIT_API_SECRET is not configured")
    if not room_name:
        raise ValueError("room_name cannot be empty")
    if not participant_identity:
        raise ValueError("participant_identity cannot be empty")

    try:
        # Create access token
        token = api.AccessToken(
            settings.livekit_api_key,
            settings.livekit_api_secret,
        ).with_identity(participant_identity)

        if participant_name:
            token = token.with_name(participant_name)

        # Add video grant
        token = token.with_metadata("").with_grant(
            api.VideoGrant(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
            )
        )

        return token.to_jwt()
    except AttributeError as e:
        logger.error(f"LiveKit SDK error: {str(e)}")
        raise ValueError(f"Invalid LiveKit SDK usage: {str(e)}") from e
    except Exception as e:
        logger.error(f"Error generating LiveKit token: {str(e)}")
        raise

