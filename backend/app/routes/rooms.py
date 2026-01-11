"""Room management endpoints."""

from fastapi import APIRouter, Depends

from app.auth import GetCurrentUser
from app.models import RoomInfo, RoomListResponse

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("", response_model=RoomListResponse)
async def list_rooms(
    current_user: GetCurrentUser,
):
    """
    List available rooms.

    For v1, this is a placeholder endpoint. In production, this would
    connect to LiveKit server to fetch actual room information.
    """
    # TODO: Integrate with LiveKit RoomService to fetch actual rooms
    # For now, return empty list
    return RoomListResponse(rooms=[])


@router.get("/{room_name}", response_model=RoomInfo)
async def get_room(
    room_name: str,
    current_user: GetCurrentUser,
):
    """
    Get information about a specific room.

    For v1, this is a placeholder endpoint.
    """
    # TODO: Integrate with LiveKit RoomService to fetch room info
    return RoomInfo(name=room_name, num_participants=0)

