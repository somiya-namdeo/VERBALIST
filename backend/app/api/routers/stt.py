import os
import requests
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.config import settings

router = APIRouter()

@router.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    if not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be an audio file.")
        
    try:
        content = await audio.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty audio file.")
        
        # Determine mime type fallback
        mime_type = audio.content_type if audio.content_type else "audio/webm"
        
        if not settings.GROQ_STT_API_KEY:
            raise Exception("GROQ_STT_API_KEY is not configured")

        response = requests.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {settings.GROQ_STT_API_KEY}"},
            files={"file": ("audio.webm", content, mime_type)},
            data={"model": settings.GROQ_STT_MODEL}
        )
        
        if response.status_code == 429:
            raise HTTPException(status_code=429, detail="Groq API rate limit exceeded")
            
        if not response.ok:
            raise Exception(f"Groq API error {response.status_code}: {response.text}")
            
        result = response.json()
        text = result.get("text", "").strip()
        
        return {"text": text}
    except HTTPException:
        raise
    except Exception as e:
        if getattr(e, "code", None) == 429 or getattr(e, "status_code", None) == 429 or "429" in str(e):
            raise HTTPException(status_code=429, detail="Speech recognition is temporarily rate limited")
        raise HTTPException(status_code=500, detail=f"Speech to text processing failed: {str(e)}")
