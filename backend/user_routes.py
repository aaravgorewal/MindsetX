import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from auth import get_current_uid, get_firestore_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["User"])


class UserProfileUpdate(BaseModel):
    """
    Partial update payload for a user's profile.
    All fields are optional to allow selective merging.
    """
    displayName: Optional[str] = Field(None, description="User's display name")
    preferredLanguage: Optional[str] = Field(None, description="Preferred language (e.g. 'hinglish', 'en', 'hi')")
    onboardingComplete: Optional[bool] = Field(None, description="Whether user onboarding has been completed")


@router.get("/profile", summary="Get current user profile")
async def get_user_profile(uid: str = Depends(get_current_uid)) -> Dict[str, Any]:
    """
    Fetch the profile document for the authenticated user from Firestore (`users/{uid}`).
    Returns 404 if the document does not exist.
    """
    db = get_firestore_client()
    doc_ref = db.collection("users").document(uid)

    try:
        doc = doc_ref.get()
    except Exception as e:
        logger.error("Failed to read user document from Firestore: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile",
        )

    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )

    return doc.to_dict() or {}


@router.patch("/profile", summary="Update current user profile")
async def update_user_profile(
    profile_update: UserProfileUpdate,
    uid: str = Depends(get_current_uid),
) -> Dict[str, Any]:
    """
    Partially update the authenticated user's profile in Firestore (`users/{uid}`).
    Merges specified fields into the existing document.
    """
    update_data = profile_update.model_dump(exclude_unset=True)
    if not update_data:
        return {
            "status": "success",
            "message": "No fields to update",
            "updated": {},
        }

    db = get_firestore_client()
    doc_ref = db.collection("users").document(uid)

    try:
        doc_ref.set(update_data, merge=True)
    except Exception as e:
        logger.error("Failed to update user document in Firestore: %s", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile",
        )

    return {
        "status": "success",
        "message": "User profile updated successfully",
        "updated": update_data,
    }
