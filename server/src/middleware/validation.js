/**
 * Request Validation Middleware
 * Validates incoming request data
 */

/**
 * Validate registration data
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  // Email validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please provide a valid email address');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  // Role validation
  const validRoles = ['DOCTOR', 'PARAMEDIC', 'ADMIN'];
  if (role && !validRoles.includes(role)) {
    errors.push('Invalid role. Must be DOCTOR, PARAMEDIC, or ADMIN');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate login data
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate patient data
 */
const validatePatient = (req, res, next) => {
  const {
    age,
    gender,
    heartRate,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    oxygenSaturation,
    temperature,
    respiratoryRate
  } = req.body;

  const errors = [];

  // Age validation
  if (age === undefined || age < 0 || age > 150) {
    errors.push('Age must be between 0 and 150');
  }

  // Gender validation
  const validGenders = ['Male', 'Female', 'Other'];
  if (!gender || !validGenders.includes(gender)) {
    errors.push('Gender must be Male, Female, or Other');
  }

  // Heart rate validation
  if (heartRate === undefined || heartRate < 0 || heartRate > 300) {
    errors.push('Heart rate must be between 0 and 300 bpm');
  }

  // Blood pressure validation
  if (bloodPressureSystolic === undefined || bloodPressureSystolic < 0 || bloodPressureSystolic > 300) {
    errors.push('Systolic blood pressure must be between 0 and 300 mmHg');
  }

  if (bloodPressureDiastolic === undefined || bloodPressureDiastolic < 0 || bloodPressureDiastolic > 200) {
    errors.push('Diastolic blood pressure must be between 0 and 200 mmHg');
  }

  // Oxygen saturation validation
  if (oxygenSaturation === undefined || oxygenSaturation < 0 || oxygenSaturation > 100) {
    errors.push('Oxygen saturation must be between 0 and 100%');
  }

  // Temperature validation
  if (temperature === undefined || temperature < 20 || temperature > 50) {
    errors.push('Temperature must be between 20 and 50°C');
  }

  // Respiratory rate validation
  if (respiratoryRate === undefined || respiratoryRate < 0 || respiratoryRate > 100) {
    errors.push('Respiratory rate must be between 0 and 100 breaths/min');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    if (!id || !objectIdRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validatePatient,
  validateObjectId
};
