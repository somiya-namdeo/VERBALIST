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
    allow_origins=["*"],
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
    from supabase import create_client
    from app.core.config import settings
    try:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        res = client.auth.sign_in_with_password({
            "email": "verbalist_test_user3@gmail.com",
            "password": "SecurePassword123!"
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

