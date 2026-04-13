import os
from pathlib import Path
from typing import List

class Settings:
    def __init__(self):
        # Load from .env if it exists
        self._load_env()
        
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./oralguard.db")
        self.secret_key = os.getenv("SECRET_KEY", "change-me-in-production")
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
        self.api_prefix = os.getenv("API_PREFIX", "/api")
        self.allowed_origins = [
            "http://localhost:8080",
            "http://localhost:5173",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:5173",
            "https://oral-guard.vercel.app",
            "https://oral-guard-git-main-v1k704.vercel.app",  # Vercel preview deployments
            os.getenv("VERCEL_URL", ""),  # Dynamic Vercel URL
        ]
        self.model_path = os.getenv("MODEL_PATH", "./backend/model_store/oralguard_model.joblib")
        self.image_model_path = os.getenv("IMAGE_MODEL_PATH", "./backend/model_store/oralguard_image_model.joblib")
        self.image_model_input_size = int(os.getenv("IMAGE_MODEL_INPUT_SIZE", "224"))
        self.data_path = os.getenv("DATA_PATH", "./backend/data/oral_cancer_dataset.csv")
    
    def _load_env(self):
        """Load environment variables from .env file"""
        env_file = Path(__file__).resolve().parent / ".env"
        if env_file.exists():
            try:
                with open(env_file) as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            key, value = line.split("=", 1)
                            os.environ.setdefault(key.strip(), value.strip())
            except Exception:
                pass

settings = Settings()
