import os
import logging
from typing import Optional
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore
from fastapi import Header, HTTPException, status

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Firebase service account path from environment variable
FIREBASE_SERVICE_ACCOUNT_PATH = os.getenv(
    "FIREBASE_SERVICE_ACCOUNT_PATH", "./firebase-service-account.json"
)

_firebase_initialized = False
_firestore_client = None


def _resolve_service_account_path(path_str: str) -> str:
    """Resolves service account path relative to cwd or backend directory."""
    if os.path.isabs(path_str):
        return path_str
    if os.path.exists(path_str):
        return os.path.abspath(path_str)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidate = os.path.normpath(os.path.join(base_dir, path_str))
    if os.path.exists(candidate):
        return candidate
    return path_str


def initialize_firebase():
    """Initializes Firebase Admin SDK if not already initialized."""
    global _firebase_initialized
    if _firebase_initialized or firebase_admin._apps:
        _firebase_initialized = True
        return

    resolved_path = _resolve_service_account_path(FIREBASE_SERVICE_ACCOUNT_PATH)
    if os.path.exists(resolved_path):
        try:
            cred = credentials.Certificate(resolved_path)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase Admin SDK initialized successfully.")
        except Exception as e:
            logger.error("Failed to initialize Firebase Admin SDK: %s", type(e).__name__)
    else:
        logger.warning(
            "Firebase service account file not found at '%s'. "
            "Token verification will fail until the service account JSON key is placed.",
            resolved_path,
        )


# Initialize on module load if service account exists
initialize_firebase()


def get_firestore_client():
    """
    Returns a Firestore client using the already-initialized Firebase Admin app.
    Ensures initialize_firebase() has run, but never initializes the app twice.
    """
    global _firestore_client
    if not _firebase_initialized and not firebase_admin._apps:
        initialize_firebase()

    if not firebase_admin._apps:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Admin SDK is not initialized. Please ensure the service account key is configured.",
        )

    if _firestore_client is None:
        _firestore_client = firestore.client()
    return _firestore_client


get_firestore_db = get_firestore_client


async def get_current_uid(authorization: Optional[str] = Header(None)) -> str:
    """
    FastAPI dependency that extracts and validates the Firebase ID token
    from the Authorization header ('Bearer <idToken>').

    Returns:
        str: The verified Firebase user ID (uid).

    Raises:
        HTTPException(401): If authorization header is missing, malformed, or verification fails.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication token",
        )

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication token",
        )

    id_token = parts[1].strip()

    # Ensure Firebase Admin SDK is initialized
    if not _firebase_initialized and not firebase_admin._apps:
        initialize_firebase()

    if not _firebase_initialized and not firebase_admin._apps:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication token",
        )

    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        uid = decoded_token.get("uid")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing authentication token",
            )
        return uid
    except HTTPException:
        raise
    except Exception as e:
        # Strict privacy: do NOT log or print the token value anywhere
        logger.error("Firebase token verification failed: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication token",
        )
