"""
ML Microservice for Emergency Healthcare Platform
FastAPI-based prediction service with XGBoost + LSTM ensemble
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uvicorn
import os

from models.predictor import ICUPredictor
from config import settings

# Initialize FastAPI app
app = FastAPI(
    title="Emergency Healthcare ML Service",
    description="ICU Prediction Microservice using XGBoost + LSTM Ensemble",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor
predictor = ICUPredictor()


# Request/Response Models
class PatientVitals(BaseModel):
    """Input schema for patient vital signs"""
    age: int = Field(..., ge=0, le=150, description="Patient age in years")
    gender: str = Field(..., description="Patient gender (Male/Female/Other)")
    heart_rate: int = Field(..., ge=0, le=300, description="Heart rate in bpm")
    systolic_blood_pressure: int = Field(..., ge=0, le=300, description="Systolic BP in mmHg")
    diastolic_blood_pressure: int = Field(..., ge=0, le=200, description="Diastolic BP in mmHg")
    oxygen_saturation: float = Field(..., ge=0, le=100, description="SpO2 percentage")
    temperature: float = Field(..., ge=20, le=50, description="Body temperature in Celsius")
    respiratory_rate: int = Field(..., ge=0, le=100, description="Respiratory rate per minute")
    gcs_score: Optional[int] = Field(14, ge=3, le=15, description="Glasgow Coma Scale score")
    lactate_level: Optional[float] = Field(2.0, ge=0, description="Blood lactate level")

    model_config = {
        "json_schema_extra": {
            "example": {
                "age": 65,
                "gender": "Male",
                "heart_rate": 95,
                "systolic_blood_pressure": 140,
                "diastolic_blood_pressure": 90,
                "oxygen_saturation": 94.5,
                "temperature": 37.8,
                "respiratory_rate": 22,
                "gcs_score": 14,
                "lactate_level": 2.5
            }
        }
    }


class PredictionResponse(BaseModel):
    """Output schema for ICU prediction"""
    needs_icu: bool
    risk_score: float
    risk_level: str
    confidence: float
    model_version: str
    summary: Optional[str] = None
    xgboost_score: Optional[float] = None
    lstm_score: Optional[float] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    version: str


# API Endpoints
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Emergency Healthcare ML Microservice",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "predict": "/predict",
            "health": "/health",
            "docs": "/docs"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring"""
    return HealthResponse(
        status="healthy",
        model_loaded=predictor.is_loaded(),
        version="1.0.0"
    )


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_icu(patient: PatientVitals):
    """
    Predict ICU requirement based on patient vital signs.
    
    Uses an ensemble of XGBoost (tabular features) and LSTM (time-series patterns)
    to provide accurate ICU risk assessment.
    """
    try:
        # Prepare patient data
        patient_data = {
            "age": patient.age,
            "gender": patient.gender,
            "heart_rate": patient.heart_rate,
            "systolic_blood_pressure": patient.systolic_blood_pressure,
            "diastolic_blood_pressure": patient.diastolic_blood_pressure,
            "oxygen_saturation": patient.oxygen_saturation,
            "temperature": patient.temperature,
            "respiratory_rate": patient.respiratory_rate,
            "gcs_score": patient.gcs_score or 14,
            "lactate_level": patient.lactate_level or 2.0
        }
        
        # Get prediction
        result = predictor.predict(patient_data)
        
        return PredictionResponse(
            needs_icu=result["needs_icu"],
            risk_score=result["risk_score"],
            risk_level=result["risk_level"],
            confidence=result["confidence"],
            model_version=result["model_version"],
            summary=result.get("summary"),
            xgboost_score=result.get("xgboost_score"),
            lstm_score=result.get("lstm_score")
        )
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@app.get("/model/info", tags=["Model"])
async def model_info():
    """Get information about the loaded models"""
    return predictor.get_model_info()


# Run server
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
