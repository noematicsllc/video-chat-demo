"""Zitadel authentication middleware and dependency injection."""

from typing import Annotated

import httpx
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa as rsa_crypto
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from jose.utils import base64url_decode

from app.config import settings

security = HTTPBearer(auto_error=False)


def get_public_key(token: str):
    """Get the public key from JWKS for token validation."""
    from jose import jwt as jose_jwt

    # In production, cache JWKS
    jwks_url = f"{settings.zitadel_issuer_url}/.well-known/jwks.json"
    with httpx.Client() as client:
        response = client.get(jwks_url)
        response.raise_for_status()
        jwks = response.json()

    unverified_header = jose_jwt.get_unverified_header(token)
    key_data = {}
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            key_data = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
            break

    if not key_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find appropriate key",
        )

    # Decode base64url encoded values
    n_bytes = base64url_decode(key_data["n"])
    e_bytes = base64url_decode(key_data["e"])

    # Convert to integers
    n_int = int.from_bytes(n_bytes, "big")
    e_int = int.from_bytes(e_bytes, "big")

    # Create RSA public key
    public_key = rsa_crypto.RSAPublicNumbers(e_int, n_int).public_key(
        default_backend()
    )

    return public_key


async def verify_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """
    Verify Zitadel JWT token and extract user information.

    Args:
        credentials: Bearer token credentials from request header (optional)

    Returns:
        Decoded token payload with user information, or mock user if auth disabled

    Raises:
        HTTPException: If token is invalid or expired (when auth is required)
    """
    # If authentication is disabled, return a mock user
    if not settings.require_auth:
        return {
            "sub": "mock-user",
            "preferred_username": "mock-user",
            "name": "Mock User",
        }

    # If no credentials provided and auth is required, raise error
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        # Get public key from Zitadel JWKS
        public_key = get_public_key(token)

        # Verify and decode token
        payload = jwt.decode(
            token,
            public_key,
            algorithms=[settings.jwt_algorithm],
            audience=settings.zitadel_client_id,
            issuer=settings.zitadel_issuer_url,
        )

        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Dependency for protected routes
GetCurrentUser = Annotated[dict, Depends(verify_token)]

