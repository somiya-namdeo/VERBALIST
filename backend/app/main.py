from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers import products, shopping_list, history, preferences, agent, stt

app = FastAPI(
    title="Verbalist API",
    description="Backend for Verbalist Agentic Voice Shopping Assistant",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://verbalist.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(shopping_list.router, prefix="/api/shopping-list", tags=["Shopping List"])
app.include_router(history.router, prefix="/api/shopping-history", tags=["Shopping History"])
app.include_router(preferences.router, prefix="/api/preferences", tags=["User Preferences"])
app.include_router(agent.router, prefix="/api/agent", tags=["Agent"])
app.include_router(stt.router, prefix="/api", tags=["Speech To Text"])


@app.post("/api/dev/login", tags=["Dev"])
def dev_login():
    """
    Creates a unique guest user session so that every new client receives
    an isolated shopping list and history.
    """
    import uuid
    from supabase import create_client
    from app.core.config import settings
    try:
        # 1. Generate unique guest credentials
        guest_email = f"guest_{uuid.uuid4().hex[:12]}@verbalist.app"
        guest_password = "SecureGuestPassword123!"

        # 2. Use service role to bypass email confirmation requirement
        service_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        service_client.auth.admin.create_user({
            "email": guest_email,
            "password": guest_password,
            "email_confirm": True
        })

        # 3. Sign in to get the JWT token for this specific guest
        anon_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        res = anon_client.auth.sign_in_with_password({
            "email": guest_email,
            "password": guest_password
        })
        
        return {"access_token": res.session.access_token}
    except Exception as e:
        return {"error": str(e)}

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "service": "verbalist"
    }

@app.get("/", tags=["System"])
def root():
    return {
        "name": "VERBALIST",
        "message": "Voice Command Shopping Assistant API",
        "status": "running",
        "docs": "/docs"
    }

