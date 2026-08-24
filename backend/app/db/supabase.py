from supabase import create_client, Client
from app.core.config import settings

def get_service_client() -> Client:
    """
    Returns a Supabase client initialized with the SERVICE_ROLE_KEY.
    Used ONLY for backend-controlled catalog operations where RLS should be bypassed.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def get_user_client(token: str) -> Client:
    """
    Returns a Supabase client initialized with the user's JWT token.
    This ensures all database operations are executed under the user's identity,
    meaning Row Level Security (RLS) policies are natively enforced by Postgres.
    """
    from supabase.client import ClientOptions
    options = ClientOptions(headers={"Authorization": f"Bearer {token}"})
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY, options=options)
