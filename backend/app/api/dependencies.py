from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.supabase import get_user_client
from supabase import Client

security = HTTPBearer()

def get_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extracts the Bearer token from the request header."""
    return credentials.credentials

class AuthenticatedUser:
    def __init__(self, client: Client, user_id: str):
        self.client = client
        self.user_id = user_id

def get_current_user(token: str = Depends(get_token)) -> AuthenticatedUser:
    """
    Returns an AuthenticatedUser containing the user-scoped client and user_id.
    """
    client = get_user_client(token)
    try:
        user_response = client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return AuthenticatedUser(client=client, user_id=user_response.user.id)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
