/**
 * Patient Model
 * Schema for emergency patient data and ICU predictions
 */
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Basic Patient Information
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age cannot exceed 150']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['Male', 'Female', 'Other'],
      message: 'Gender must be Male, Female, or Other'
    }
  },
  
  // Vital Signs
  heartRate: {
    type: Number,
    required: [true, 'Heart rate is required'],
    min: [0, 'Heart rate cannot be negative'],
    max: [300, 'Heart rate value seems incorrect']
  },
  bloodPressureSystolic: {
    type: Number,
    required: [true, 'Systolic blood pressure is required'],
    min: [0, 'Systolic BP cannot be negative'],
    max: [300, 'Systolic BP value seems incorrect']
  },
  bloodPressureDiastolic: {
    type: Number,
    required: [true, 'Diastolic blood pressure is required'],
    min: [0, 'Diastolic BP cannot be negative'],
    max: [200, 'Diastolic BP value seems incorrect']
  },
  oxygenSaturation: {
    type: Number,
    required: [true, 'Oxygen saturation is required'],
    min: [0, 'O2 saturation cannot be negative'],
    max: [100, 'O2 saturation cannot exceed 100%']
  },
  temperature: {
    type: Number,
    required: [true, 'Temperature is required'],
    min: [20, 'Temperature value seems too low'],
    max: [50, 'Temperature value seems too high']
  },
  respiratoryRate: {
    type: Number,
    required: [true, 'Respiratory rate is required'],
    min: [0, 'Respiratory rate cannot be negative'],
    max: [100, 'Respiratory rate value seems incorrect']
  },
  
  // Additional Clinical Data (optional)
  gcsScore: {
    type: Number,
    min: [3, 'GCS score minimum is 3'],
    max: [15, 'GCS score maximum is 15'],
    default: 14
  },
  lactateLevel: {
    type: Number,
    min: [0, 'Lactate level cannot be negative'],
    default: 2.0
  },
  
  // Location and Notes
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  
  // ML Prediction Results
  prediction: {
    needsICU: {
      type: Boolean,
      default: null
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: null
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null
    },
    modelVersion: {
      type: String,
      default: 'v1.0'
    },
    generatedSummary: {
      type: String,
      default: null
    }
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['Incoming', 'Triaged', 'In Treatment', 'Admitted', 'Discharged', 'Transferred'],
    default: 'Incoming'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3 // 1 = highest priority, 5 = lowest
  },
  
  // Staff References
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Timestamps
  arrivalTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
patientSchema.index({ createdAt: -1 });
patientSchema.index({ status: 1 });
patientSchema.index({ 'prediction.riskLevel': 1 });
patientSchema.index({ submittedBy: 1 });
patientSchema.index({ assignedDoctor: 1 });

// Virtual for blood pressure string
patientSchema.virtual('bloodPressure').get(function() {
  return `${this.bloodPressureSystolic}/${this.bloodPressureDiastolic}`;
});

// Virtual for age group
patientSchema.virtual('ageGroup').get(function() {
  if (this.age < 18) return 'Pediatric';
  if (this.age < 65) return 'Adult';
  return 'Geriatric';
});

// Pre-save middleware to calculate priority based on vitals
patientSchema.pre('save', function(next) {
  // Auto-calculate priority if prediction exists
  if (this.prediction && this.prediction.riskScore !== null) {
    if (this.prediction.riskScore >= 0.8) {
      this.priority = 1;
      this.prediction.riskLevel = 'Critical';
    } else if (this.prediction.riskScore >= 0.6) {
      this.priority = 2;
      this.prediction.riskLevel = 'High';
    } else if (this.prediction.riskScore >= 0.4) {
      this.priority = 3;
      this.prediction.riskLevel = 'Medium';
    } else {
      this.priority = 4;
      this.prediction.riskLevel = 'Low';
    }
  }
  next();
});

// Static method to get patients by risk level
patientSchema.statics.findByRiskLevel = function(riskLevel) {
  return this.find({ 'prediction.riskLevel': riskLevel })
    .populate('submittedBy', 'name')
    .populate('assignedDoctor', 'name')
    .sort({ createdAt: -1 });
};

// Static method to get recent patients
patientSchema.statics.findRecent = function(limit = 20) {
  return this.find()
    .populate('submittedBy', 'name role')
    .populate('assignedDoctor', 'name')
    .sort({ createdAt: -1 })
    .limit(limit);
};

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
