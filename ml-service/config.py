"""
ML Service Configuration
Environment variables and settings
"""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 5001
    DEBUG: bool = False
    
    # Model paths
    MODEL_PATH: str = os.path.join(os.path.dirname(__file__), "..", "models", "emergency_predictor_stacked.pkl")
    SCALER_PATH: str = os.path.join(os.path.dirname(__file__), "..", "models", "scaler.pkl")
    FEATURE_LIST_PATH: str = os.path.join(os.path.dirname(__file__), "..", "models", "feature_list.pkl")
    LSTM_MODEL_PATH: str = os.path.join(os.path.dirname(__file__), "..", "models", "lstm_model.keras")
    
    # Legacy paths (from parent directory)
    LEGACY_MODEL_PATH: str = os.path.join(os.path.dirname(__file__), "..", "..", "emergency_predictor_stacked.pkl")
    LEGACY_SCALER_PATH: str = os.path.join(os.path.dirname(__file__), "..", "..", "scaler.pkl")
    LEGACY_FEATURE_LIST_PATH: str = os.path.join(os.path.dirname(__file__), "..", "..", "feature_list.pkl")
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5000", "http://localhost:5173"]
    
    # Model configuration
    ENSEMBLE_WEIGHTS: dict = {"xgboost": 0.7, "lstm": 0.3}
    
    # Risk thresholds
    RISK_THRESHOLD_CRITICAL: float = 0.8
    RISK_THRESHOLD_HIGH: float = 0.6
    RISK_THRESHOLD_MEDIUM: float = 0.4
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
