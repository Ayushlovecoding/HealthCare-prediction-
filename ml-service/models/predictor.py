"""
ICU Predictor - Ensemble Model
Combines XGBoost and LSTM predictions for ICU risk assessment
"""
import os
import numpy as np
import pandas as pd
import joblib
from typing import Dict, Any, Optional

from config import settings
from .lstm_model import LSTMPredictor


class ICUPredictor:
    """
    Ensemble ICU predictor combining:
    - XGBoost: For tabular feature analysis
    - LSTM: For time-series vital sign patterns
    
    Uses weighted averaging for final prediction.
    """
    
    def __init__(self):
        self.xgboost_model = None
        self.scaler = None
        self.feature_list = None
        self.lstm_predictor = None
        self.model_version = "1.0.0"
        
        # Default feature values for missing data
        self.default_values = {
            'GCS_first': 14.0,
            'Lactate_first': 2.0,
            'SAPS-I': 38.0
        }
        
        # Tabular features for XGBoost
        self.tabular_features = [
            'Age', 'Gender', 'HR_first', 'SysABP_first', 'DiasABP_first',
            'SaO2_first', 'Temp_first', 'RespRate_first', 'GCS_first',
            'Lactate_first', 'SAPS-I'
        ]
        
        # Load models
        self._load_models()
    
    def _load_models(self):
        """Load all required models and preprocessors"""
        # Try loading from ml-service/models directory first, then legacy paths
        model_paths = [
            (settings.MODEL_PATH, settings.SCALER_PATH, settings.FEATURE_LIST_PATH),
            (settings.LEGACY_MODEL_PATH, settings.LEGACY_SCALER_PATH, settings.LEGACY_FEATURE_LIST_PATH)
        ]
        
        for model_path, scaler_path, feature_path in model_paths:
            try:
                if os.path.exists(model_path):
                    self.xgboost_model = joblib.load(model_path)
                    print(f"✅ XGBoost model loaded from {model_path}")
                    
                    if os.path.exists(scaler_path):
                        self.scaler = joblib.load(scaler_path)
                        print(f"✅ Scaler loaded from {scaler_path}")
                    
                    if os.path.exists(feature_path):
                        self.feature_list = joblib.load(feature_path)
                        print(f"✅ Feature list loaded from {feature_path}")
                    
                    break
            except Exception as e:
                print(f"⚠️ Error loading model from {model_path}: {e}")
        
        if self.xgboost_model is None:
            print("⚠️ XGBoost model not found. Using fallback predictions.")
        
        # Initialize LSTM predictor
        try:
            self.lstm_predictor = LSTMPredictor(settings.LSTM_MODEL_PATH)
            print("✅ LSTM predictor initialized")
        except Exception as e:
            print(f"⚠️ Error initializing LSTM predictor: {e}")
            self.lstm_predictor = LSTMPredictor()  # Use default/fallback
    
    def _prepare_features(self, patient_data: Dict[str, Any]) -> pd.DataFrame:
        """Prepare features for XGBoost model"""
        # Map input to model features
        features = self.default_values.copy()
        features.update({
            'Age': float(patient_data.get('age', 50)),
            'Gender': 1 if str(patient_data.get('gender', '')).lower() == 'male' else 0,
            'HR_first': float(patient_data.get('heart_rate', 80)),
            'SysABP_first': float(patient_data.get('systolic_blood_pressure', 120)),
            'DiasABP_first': float(patient_data.get('diastolic_blood_pressure', 80)),
            'SaO2_first': float(patient_data.get('oxygen_saturation', 98)),
            'Temp_first': float(patient_data.get('temperature', 37)),
            'RespRate_first': float(patient_data.get('respiratory_rate', 16)),
            'GCS_first': float(patient_data.get('gcs_score', 14)),
            'Lactate_first': float(patient_data.get('lactate_level', 2.0))
        })
        
        # Use feature list if available, otherwise use tabular features
        feature_columns = self.feature_list if self.feature_list else self.tabular_features
        
        # Create DataFrame with correct column order
        df = pd.DataFrame([features])
        
        # Ensure all required columns exist
        for col in feature_columns:
            if col not in df.columns:
                df[col] = self.default_values.get(col, 0)
        
        # Reorder to match expected features
        df = df[feature_columns]
        
        return df
    
    def _get_xgboost_prediction(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get prediction from XGBoost model"""
        if self.xgboost_model is None:
            return self._fallback_prediction(patient_data)
        
        try:
            # Prepare features
            df = self._prepare_features(patient_data)
            
            # Scale features if scaler is available
            if self.scaler is not None:
                scaled_features = self.scaler.transform(df)
                df = pd.DataFrame(scaled_features, columns=df.columns)
            
            # Get features expected by model
            if hasattr(self.xgboost_model, 'feature_names_in_'):
                model_features = self.xgboost_model.feature_names_in_
                df = df[model_features]
            
            # Predict
            prediction = self.xgboost_model.predict(df)[0]
            probability = self.xgboost_model.predict_proba(df)[0][1]
            
            return {
                "risk_score": float(probability),
                "prediction": int(prediction),
                "model_type": "xgboost",
                "success": True
            }
            
        except Exception as e:
            print(f"XGBoost prediction error: {e}")
            return self._fallback_prediction(patient_data)
    
    def _fallback_prediction(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback rule-based prediction when models unavailable"""
        risk_score = 0.0
        risk_factors = []
        
        # Age risk
        age = patient_data.get('age', 50)
        if age > 75:
            risk_score += 0.15
            risk_factors.append("Advanced age (>75)")
        elif age > 65:
            risk_score += 0.08
        
        # Heart rate
        hr = patient_data.get('heart_rate', 80)
        if hr > 130 or hr < 45:
            risk_score += 0.2
            risk_factors.append(f"Critical heart rate ({hr} bpm)")
        elif hr > 110 or hr < 55:
            risk_score += 0.1
        
        # Blood pressure
        sys_bp = patient_data.get('systolic_blood_pressure', 120)
        dia_bp = patient_data.get('diastolic_blood_pressure', 80)
        if sys_bp > 180 or sys_bp < 85:
            risk_score += 0.2
            risk_factors.append(f"Critical BP ({sys_bp}/{dia_bp})")
        elif sys_bp > 150 or sys_bp < 95:
            risk_score += 0.1
        
        # Oxygen saturation
        spo2 = patient_data.get('oxygen_saturation', 98)
        if spo2 < 88:
            risk_score += 0.3
            risk_factors.append(f"Severe hypoxia (SpO2: {spo2}%)")
        elif spo2 < 92:
            risk_score += 0.2
            risk_factors.append(f"Low oxygen ({spo2}%)")
        elif spo2 < 95:
            risk_score += 0.1
        
        # Temperature
        temp = patient_data.get('temperature', 37)
        if temp > 40 or temp < 34:
            risk_score += 0.15
            risk_factors.append(f"Critical temperature ({temp}°C)")
        elif temp > 38.5 or temp < 35.5:
            risk_score += 0.08
        
        # Respiratory rate
        resp = patient_data.get('respiratory_rate', 16)
        if resp > 35 or resp < 8:
            risk_score += 0.2
            risk_factors.append(f"Critical respiratory rate ({resp}/min)")
        elif resp > 25 or resp < 10:
            risk_score += 0.1
        
        # GCS score
        gcs = patient_data.get('gcs_score', 14)
        if gcs < 9:
            risk_score += 0.25
            risk_factors.append(f"Severely altered consciousness (GCS: {gcs})")
        elif gcs < 13:
            risk_score += 0.12
        
        return {
            "risk_score": min(risk_score, 1.0),
            "prediction": 1 if risk_score >= 0.5 else 0,
            "model_type": "fallback_rules",
            "risk_factors": risk_factors,
            "success": True
        }
    
    def predict(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate ensemble prediction combining XGBoost and LSTM.
        
        Args:
            patient_data: Dictionary containing patient vital signs
            
        Returns:
            Dictionary with prediction results
        """
        # Get individual predictions
        xgb_result = self._get_xgboost_prediction(patient_data)
        lstm_result = self.lstm_predictor.predict(patient_data) if self.lstm_predictor else {"risk_score": 0.5}
        
        # Weighted ensemble
        xgb_weight = settings.ENSEMBLE_WEIGHTS.get("xgboost", 0.7)
        lstm_weight = settings.ENSEMBLE_WEIGHTS.get("lstm", 0.3)
        
        # Calculate ensemble score
        xgb_score = xgb_result.get("risk_score", 0.5)
        lstm_score = lstm_result.get("risk_score", 0.5)
        
        ensemble_score = (xgb_score * xgb_weight) + (lstm_score * lstm_weight)
        
        # Determine risk level
        if ensemble_score >= settings.RISK_THRESHOLD_CRITICAL:
            risk_level = "Critical"
        elif ensemble_score >= settings.RISK_THRESHOLD_HIGH:
            risk_level = "High"
        elif ensemble_score >= settings.RISK_THRESHOLD_MEDIUM:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        # Calculate confidence based on model agreement
        score_diff = abs(xgb_score - lstm_score)
        confidence = 1.0 - (score_diff * 0.5)  # Higher agreement = higher confidence
        
        # Generate summary
        summary = self._generate_summary(patient_data, ensemble_score, risk_level)
        
        return {
            "needs_icu": ensemble_score >= 0.5,
            "risk_score": round(ensemble_score, 4),
            "risk_level": risk_level,
            "confidence": round(confidence, 4),
            "model_version": self.model_version,
            "summary": summary,
            "xgboost_score": round(xgb_score, 4),
            "lstm_score": round(lstm_score, 4)
        }
    
    def _generate_summary(self, patient_data: Dict[str, Any], risk_score: float, risk_level: str) -> str:
        """Generate clinical summary for the prediction"""
        age = patient_data.get('age', 'Unknown')
        gender = patient_data.get('gender', 'Unknown')
        hr = patient_data.get('heart_rate', 'N/A')
        bp = f"{patient_data.get('systolic_blood_pressure', 'N/A')}/{patient_data.get('diastolic_blood_pressure', 'N/A')}"
        spo2 = patient_data.get('oxygen_saturation', 'N/A')
        
        summary = f"{age}-year-old {gender.lower()} patient presents with "
        
        concerns = []
        
        # Heart rate assessment
        if hr != 'N/A':
            if hr > 100:
                concerns.append(f"tachycardia (HR: {hr} bpm)")
            elif hr < 60:
                concerns.append(f"bradycardia (HR: {hr} bpm)")
        
        # Blood pressure assessment
        sys_bp = patient_data.get('systolic_blood_pressure')
        if sys_bp:
            if sys_bp > 140:
                concerns.append(f"hypertension (BP: {bp})")
            elif sys_bp < 90:
                concerns.append(f"hypotension (BP: {bp})")
        
        # Oxygen assessment
        if spo2 != 'N/A' and spo2 < 95:
            concerns.append(f"hypoxia (SpO2: {spo2}%)")
        
        if concerns:
            summary += ", ".join(concerns) + ". "
        else:
            summary += "stable vitals. "
        
        summary += f"ML assessment indicates {risk_level.upper()} risk (score: {risk_score:.1%}) for ICU admission."
        
        return summary
    
    def is_loaded(self) -> bool:
        """Check if models are loaded"""
        return self.xgboost_model is not None or (self.lstm_predictor and self.lstm_predictor.is_loaded())
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models"""
        return {
            "version": self.model_version,
            "ensemble_weights": settings.ENSEMBLE_WEIGHTS,
            "xgboost": {
                "loaded": self.xgboost_model is not None,
                "features": self.tabular_features
            },
            "lstm": self.lstm_predictor.get_model_info() if self.lstm_predictor else {"status": "not_loaded"},
            "scaler_loaded": self.scaler is not None,
            "feature_list_loaded": self.feature_list is not None,
            "risk_thresholds": {
                "critical": settings.RISK_THRESHOLD_CRITICAL,
                "high": settings.RISK_THRESHOLD_HIGH,
                "medium": settings.RISK_THRESHOLD_MEDIUM
            }
        }
