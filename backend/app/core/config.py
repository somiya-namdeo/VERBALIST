import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(env_path)

class Settings:
    PROJECT_NAME: str = "Verbalist API"
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", os.getenv("SUPABASE_KEY", ""))
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_KEY", ""))
    GROQ_STT_API_KEY: str = os.getenv("GROQ_STT_API_KEY", "")
    GROQ_LLM_API_KEY: str = os.getenv("GROQ_LLM_API_KEY", "")
    GROQ_STT_MODEL: str = os.getenv("GROQ_STT_MODEL", "whisper-large-v3-turbo")
    GROQ_LLM_MODEL: str = os.getenv("GROQ_LLM_MODEL", "openai/gpt-oss-20b")

settings = Settings()
