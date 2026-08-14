import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from .database import Base, engine, SessionLocal
from . import seed
from .routers import auth as auth_router
from .routers import patients, screenings, referrals, notifications, lab_tests, analytics, assistant, models as models_router
from .routers import rag_demo, whatsapp, chat

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HealthSense AI API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
# Always allow the demo page (served locally) and wildcard for dev
if "*" not in origins:
    origins.append("*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve chatbot demo HTML at /chatbot-demo
_demo_dir = Path(__file__).resolve().parent.parent.parent / "chatbot"
if _demo_dir.exists():
    app.mount("/chatbot-demo", StaticFiles(directory=str(_demo_dir), html=True), name="chatbot-demo")

app.include_router(auth_router.router)
app.include_router(patients.router)
app.include_router(screenings.router)
app.include_router(referrals.router)
app.include_router(notifications.router)
app.include_router(lab_tests.router)
app.include_router(analytics.router)
app.include_router(assistant.router)
app.include_router(models_router.router)
app.include_router(rag_demo.router)
app.include_router(whatsapp.router)
app.include_router(chat.router)




@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed.run_seed(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"status": "ok", "service": "HealthSense AI API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
