from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from database import engine, Base
from settings import settings
from routes.auth import router as auth_router
from routes.assessments import router as assessments_router
from routes.patients import router as patients_router
from routes.datasets import router as datasets_router

Base.metadata.create_all(bind=engine)


def ensure_runtime_schema_updates():
    inspector = inspect(engine)
    with engine.begin() as conn:
        if "assessment_records" in inspector.get_table_names():
            cols = {c["name"] for c in inspector.get_columns("assessment_records")}
            if "patient_id" not in cols:
                conn.execute(text("ALTER TABLE assessment_records ADD COLUMN patient_id INTEGER"))


ensure_runtime_schema_updates()
app = FastAPI(title="OralGuard Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=f"{settings.api_prefix}/auth")
app.include_router(patients_router, prefix=settings.api_prefix)
app.include_router(datasets_router, prefix=settings.api_prefix)
app.include_router(assessments_router, prefix=settings.api_prefix)


@app.get("/")
def root():
    return {"message": "OralGuard backend is running", "api_prefix": settings.api_prefix}


@app.get("/api")
def api_root():
    return {"message": "OralGuard API", "version": "0.1.0"}


# Vercel serverless function export
# The app variable must be available at module level
# This is required for Vercel Python runtime
