from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional
import os
from dotenv import load_dotenv

# Load .env file explicitly
load_dotenv()

class Settings(BaseSettings):
    database_url: str = "sqlite:///./pdf_chat.db"  # Default SQLite URL
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "").strip('"').strip("'")  # Strip quotes
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"

settings = Settings()

# Create uploads directory if it doesn't exist
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

# Verify API key is loaded
if not settings.openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")