"""
Firestore client helper for Aura Backend.
Returns a Firestore client using the already-initialized Firebase Admin app.
"""

from auth import get_firestore_client, get_firestore_db

__all__ = ["get_firestore_client", "get_firestore_db"]
