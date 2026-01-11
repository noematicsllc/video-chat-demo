"""Pydantic models for request/response validation."""

from pydantic import BaseModel, Field


class TokenRequest(BaseModel):
    """Request model for LiveKit token generation."""

    room_name: str = Field(..., min_length=1, max_length=200)
    participant_name: str | None = Field(None, max_length=200)


class TokenResponse(BaseModel):
    """Response model for LiveKit token generation."""

    token: str
    url: str


class RoomInfo(BaseModel):
    """Room information model."""

    name: str
    num_participants: int


class RoomListResponse(BaseModel):
    """Response model for room list."""

    rooms: list[RoomInfo]

