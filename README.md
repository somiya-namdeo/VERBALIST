# VERBALIST

Verbalist is an agentic voice-first grocery shopping assistant that allows users to seamlessly manage their shopping lists using natural language.

## Architecture: Two-Model AI Approach

Verbalist utilizes a highly optimized **two-model architecture** to separate speech recognition from language reasoning. This ensures maximum efficiency and API quota protection.

    Groq Whisper ? Speech-to-Text
    Groq LLM ? Natural Language Understanding + Tool Selection
    Python ? Deterministic Tool Execution
    Supabase ? Persistence

- **Groq Whisper (whisper-large-v3-turbo)**: Handles multilingual speech transcription rapidly and accurately.
- **Groq LLM**: Handles complex natural-language intent and deterministic tool selection.

**Why two models?**
Speech recognition and language reasoning are separate concerns. Groq Whisper handles multilingual speech transcription extremely efficiently, saving Groq LLM quotas for where they are truly needed: natural-language intent parsing and semantic tool selection.

### Text Flow
    Groq LLM intent/tool ? local tool ? deterministic local response

### Voice Flow
    Groq STT ? Groq LLM intent/tool ? local tool ? deterministic local response

*Note: The application uses a strictly optimized manual tool execution loop. To save Groq LLM requests, tool results are formatted deterministically by the Python backend rather than requiring a second redundant LLM summarization call.*

## Features

- **Voice input & Speech-to-text**: Speak naturally to the agent and have audio transcribed via Groq Whisper.
- **Natural-language shopping commands**: Advanced semantic parsing by Groq LLM maps human intent to strict actions.
- **Multilingual voice input**: Groq STT supports multiple languages seamlessly (e.g. Hindi, English).
- **Product search**: Search by text with automatic brand and size inference.
- **Price & Sale filtering**: Restrict searches to maximum prices and active sales via voice.
- **Add/remove/update shopping-list items**: Manage your cart by voice (e.g. adding, deleting, updating quantities).
- **Automatic categorization**: Shopping lists group automatically by product category.
- **Product substitutes**: Ask the agent to find alternatives for specific products.
- **Shopping history**: Check what you previously bought.
- **Preferences**: Manage user dietary and brand preferences.
- **Checkout**: Minimalist bulk purchase flow that clears cart and updates history.
- **Responsive/minimalist UI**: Beautiful, dark-themed, monochromatic interface tailored for voice-first interactions.

## Setup

1. **Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Groq LLM Configuration (for NLP and Agent)

# Groq Configuration (for Speech-to-Text)
GROQ_API_KEY=your_groq_api_key_here
GROQ_STT_MODEL=whisper-large-v3-turbo
```

## API Quota / Error Handling
The application is resilient to rate limits. Both the STT pipeline (Groq) and Agent pipeline (Groq LLM) strictly intercept `429 RESOURCE_EXHAUSTED` responses and propagate them gracefully to the frontend UI as user-friendly messages rather than crashing with an HTTP 500.

## Testing
To test the environment:
1. Try a voice command like "Add milk" (1 Groq request, 1 Groq LLM request).
2. Type a command like "Find toothpaste under 100" (0 Groq requests, 1 Groq LLM request).
3. Try multilingual voice inputs like "???? ???? ??? ??? ?????".
