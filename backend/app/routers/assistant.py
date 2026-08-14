import os
import httpx
from fastapi import APIRouter, Depends
from .. import models, schemas, auth

router = APIRouter(prefix="/assistant", tags=["assistant"])

SYSTEM_PROMPT = (
    "You are HealthHero, a highly knowledgeable and empathetic AI health assistant embedded in HealthSense AI, "
    "a hospital NCD (Non-Communicable Disease) screening and referral platform.\n\n"
    "Your primary goal is to provide specific, actionable, and condition-aware guidance. "
    "When context or knowledge base snippets are provided, you MUST heavily rely on them to inform your answers, "
    "incorporating specific details, numbers, and recommendations from the context rather than giving generic advice. "
    "If the user provides very little context or a poorly worded sentence, infer their likely intent based on their health profile "
    "and the provided context, and offer a helpful, specific response instead of just asking for clarification.\n\n"
    "Guidelines:\n"
    "- Keep replies clear, reassuring, and under 150 words.\n"
    "- Be specific and use the provided knowledge base context.\n"
    "- You are not a substitute for a licensed clinician — for diagnostic or urgent matters, gently advise consulting a doctor."
)


@router.post("/chat")
async def chat(payload: schemas.ChatRequest, current_user: models.User | None = Depends(auth.get_optional_user)):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {"text": "HealthHero isn't fully configured yet — ask your admin to set ANTHROPIC_API_KEY on the backend to enable live AI answers."}
    
    # Build full prompt with injected context if available
    full_prompt = SYSTEM_PROMPT + f"\n\nThe current user is logged in as: {payload.role}."
    if payload.system_context:
        full_prompt += f"\n\n{payload.system_context}"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 500,
                    "system": full_prompt,
                    "messages": [{"role": m["role"], "content": m["text"]} for m in payload.messages],
                },
            )
            data = resp.json()
            text = "\n".join(b.get("text", "") for b in data.get("content", [])).strip()
            return {"text": text or "I couldn't generate a reply just now — please try again."}
    except Exception:
        return {"text": "I'm having trouble connecting right now. Please try again in a moment."}
