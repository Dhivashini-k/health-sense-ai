import os
import httpx
from fastapi import APIRouter, Depends
from .. import models, schemas, auth

router = APIRouter(prefix="/assistant", tags=["assistant"])

SYSTEM_PROMPT = (
    "You are HealthHero, an AI assistant embedded in HealthSense AI, a hospital NCD "
    "(Diabetes, Hypertension, CVD, Stroke, CKD) screening and referral platform. "
    "Help the user understand risk reports, disease risk factors, screening steps, referral "
    "workflow, or lifestyle/diet guidance in plain, reassuring language. Keep replies under "
    "150 words. You are not a substitute for a licensed clinician — for anything diagnostic "
    "or urgent, note that a doctor should be consulted."
)


@router.post("/chat")
async def chat(payload: schemas.ChatRequest, current_user: models.User = Depends(auth.get_current_user)):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {"text": "HealthHero isn't fully configured yet — ask your admin to set ANTHROPIC_API_KEY on the backend to enable live AI answers."}
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
                    "system": SYSTEM_PROMPT + f" The current user is logged in as: {payload.role}.",
                    "messages": [{"role": m["role"], "content": m["text"]} for m in payload.messages],
                },
            )
            data = resp.json()
            text = "\n".join(b.get("text", "") for b in data.get("content", [])).strip()
            return {"text": text or "I couldn't generate a reply just now — please try again."}
    except Exception:
        return {"text": "I'm having trouble connecting right now. Please try again in a moment."}
