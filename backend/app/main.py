import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .database import Base, engine, SessionLocal
from . import seed
from .routers import auth as auth_router
from .routers import patients, screenings, referrals, notifications, lab_tests, analytics, assistant, models as models_router

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="HealthSense AI API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(patients.router)
app.include_router(screenings.router)
app.include_router(referrals.router)
app.include_router(notifications.router)
app.include_router(lab_tests.router)
app.include_router(analytics.router)
app.include_router(assistant.router)
app.include_router(models_router.router)



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
