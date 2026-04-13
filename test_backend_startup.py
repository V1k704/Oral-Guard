#!/usr/bin/env python
"""Diagnostic script to test backend startup"""
print("0: Starting test...", flush=True)

try:
    print("1: Importing settings...", flush=True)
    from backend.settings import settings
    print(f"   Settings imported OK: database={settings.database_url}", flush=True)
except Exception as e:
    print(f"   ERROR in settings: {e}", flush=True)

try:
    print("2: Importing database...", flush=True)
    from backend.database import engine, Base
    print("   Database imported OK", flush=True)
except Exception as e:
    print(f"   ERROR in database: {e}", flush=True)

try:
    print("3: Creating tables...", flush=True)
    from backend.database import engine, Base
    Base.metadata.create_all(bind=engine)
    print("   Tables created OK", flush=True)
except Exception as e:
    print(f"   ERROR in create_all: {e}", flush=True)

try:
    print("4: Importing models...", flush=True)
    from backend.models import User, Patient, AssessmentRecord
    print("   Models imported OK", flush=True)
except Exception as e:
    print(f"   ERROR in models: {e}", flush=True)

try:
    print("5: Importing App...", flush=True)
    from backend.app import app
    print("   App imported OK", flush=True)
except Exception as e:
    print(f"   ERROR in app: {e}", flush=True)

print("6: All imports successful!")
