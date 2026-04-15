from firebase_admin import auth as firebase_auth, firestore
from typing import Optional, Tuple


def verify_firebase_token(token: str) -> Tuple[str, Optional[str], Optional[str], bool]:
    """Verify Firebase token and return user data"""
    decoded = firebase_auth.verify_id_token(token)
    return (
        decoded.get("uid", ""),
        decoded.get("email"),
        decoded.get("name"),
        decoded.get("admin", False)
    )


def get_firestore_user_data(uid: str) -> Tuple[str, str]:
    """Fetch user data from Firestore, returns (first_name, last_name)"""
    try:
        firestore_db = firestore.client()
        user_doc = firestore_db.collection('users').document(uid).get()

        if not user_doc.exists:
            return "", ""

        user_data = user_doc.to_dict()
        if not user_data:
            return "", ""

        first_name = user_data.get('firstName', '').strip()
        last_name = user_data.get('lastName', '').strip()

        return first_name, last_name

    except Exception as e:
        print(f"[FirebaseAuth] Failed to fetch Firestore data for {uid}: {e}")
        return "", ""
