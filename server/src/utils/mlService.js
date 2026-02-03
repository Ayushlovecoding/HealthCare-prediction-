/**
 * ML Service Utility
 * Handles communication with the Python ML microservice
 */
const axios = require('axios');
const config = require('../config');

// Create axios instance with default config
const mlServiceClient = axios.create({
  baseURL: config.mlServiceUrl,
  timeout: 30000, // 30 second timeout for ML predictions
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Get ICU prediction from ML service
 * @param {Object} patientData - Patient vital signs and data
 * @returns {Promise<Object>} - Prediction results
 */
const getPrediction = async (patientData) => {
  try {
    const payload = {
      age: patientData.age,
      gender: patientData.gender,
      heart_rate: patientData.heartRate,
      systolic_blood_pressure: patientData.bloodPressureSystolic,
      diastolic_blood_pressure: patientData.bloodPressureDiastolic,
      oxygen_saturation: patientData.oxygenSaturation,
      temperature: patientData.temperature,
      respiratory_rate: patientData.respiratoryRate,
      gcs_score: patientData.gcsScore || 14,
      lactate_level: patientData.lactateLevel || 2.0
    };

    console.log('📤 Sending prediction request to ML service:', payload);
    
    const response = await mlServiceClient.post('/predict', payload);
    
    console.log('📥 ML Service response:', response.data);
    
    return {
      success: true,
      data: {
        needsICU: response.data.needs_icu,
        riskScore: response.data.risk_score,
        riskLevel: response.data.risk_level,
        confidence: response.data.confidence,
        modelVersion: response.data.model_version || 'v1.0',
        generatedSummary: response.data.summary || null
      }
    };
  } catch (error) {
    console.error('❌ ML Service Error:', error.message);
    
    // Return fallback prediction based on vital signs
    return {
      success: false,
      error: error.message,
      data: calculateFallbackPrediction(patientData)
    };
  }
};

/**
 * Calculate fallback prediction when ML service is unavailable
 * Uses simple rule-based logic based on vital signs
 */
const calculateFallbackPrediction = (patientData) => {
  let riskScore = 0;
  let riskFactors = 0;

  // Heart rate analysis
  if (patientData.heartRate > 120 || patientData.heartRate < 50) {
    riskScore += 0.2;
    riskFactors++;
  }

  // Blood pressure analysis
  if (patientData.bloodPressureSystolic > 180 || patientData.bloodPressureSystolic < 90) {
    riskScore += 0.2;
    riskFactors++;
  }

  // Oxygen saturation analysis
  if (patientData.oxygenSaturation < 92) {
    riskScore += 0.25;
    riskFactors++;
  }

  // Temperature analysis
  if (patientData.temperature > 39 || patientData.temperature < 35) {
    riskScore += 0.15;
    riskFactors++;
  }

  // Respiratory rate analysis
  if (patientData.respiratoryRate > 25 || patientData.respiratoryRate < 10) {
    riskScore += 0.2;
    riskFactors++;
  }

  // Age factor
  if (patientData.age > 70) {
    riskScore += 0.1;
  }

  // Normalize risk score
  riskScore = Math.min(riskScore, 1);

  // Determine risk level
  let riskLevel;
  if (riskScore >= 0.8) riskLevel = 'Critical';
  else if (riskScore >= 0.6) riskLevel = 'High';
  else if (riskScore >= 0.4) riskLevel = 'Medium';
  else riskLevel = 'Low';

  return {
    needsICU: riskScore >= 0.5,
    riskScore: parseFloat(riskScore.toFixed(3)),
    riskLevel,
    confidence: 0.6, // Lower confidence for fallback
    modelVersion: 'fallback-v1.0',
    generatedSummary: `Fallback prediction: ${riskFactors} risk factors identified. ML service unavailable.`
  };
};

/**
 * Health check for ML service
 */
const checkMLServiceHealth = async () => {
  try {
    const response = await mlServiceClient.get('/health', { timeout: 5000 });
    return {
      healthy: true,
      status: response.data
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
};

module.exports = {
  getPrediction,
  checkMLServiceHealth,
  calculateFallbackPrediction
};
