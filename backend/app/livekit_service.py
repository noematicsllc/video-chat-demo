"""LiveKit token generation service."""

from livekit import api

from app.config import settings


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
    """
    token = api.AccessToken(
        settings.livekit_api_key,
        settings.livekit_api_secret,
    ).with_identity(participant_identity)

    if participant_name:
        token = token.with_name(participant_name)

    token = token.with_metadata("").with_grant(
        api.VideoGrant(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
        )
    )

    return token.to_jwt()

