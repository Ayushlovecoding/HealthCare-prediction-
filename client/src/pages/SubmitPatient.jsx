/**
 * Submit Patient Page
 * Form for submitting new patient vitals
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  HeartIcon, 
  BeakerIcon,
  MapPinIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { usePatientStore } from '../store/patientStore'
import { LoadingSpinner } from '../components'
import toast from 'react-hot-toast'

const SubmitPatient = () => {
  const navigate = useNavigate()
  const { createPatient, isLoading } = usePatientStore()
  
  const [formData, setFormData] = useState({
    // Basic info
    age: '',
    gender: 'Male',
    
    // Vital signs
    heartRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    oxygenSaturation: '',
    temperature: '',
    respiratoryRate: '',
    
    // Optional clinical data
    gcsScore: '14',
    lactateLevel: '2.0',
    
    // Additional info
    location: '',
    notes: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    const requiredFields = ['age', 'gender', 'heartRate', 'bloodPressureSystolic', 
      'bloodPressureDiastolic', 'oxygenSaturation', 'temperature', 'respiratoryRate']
    
    const missingFields = requiredFields.filter(field => !formData[field])
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields')
      return
    }

    // Convert numeric fields
    const patientData = {
      ...formData,
      age: parseInt(formData.age),
      heartRate: parseInt(formData.heartRate),
      bloodPressureSystolic: parseInt(formData.bloodPressureSystolic),
      bloodPressureDiastolic: parseInt(formData.bloodPressureDiastolic),
      oxygenSaturation: parseFloat(formData.oxygenSaturation),
      temperature: parseFloat(formData.temperature),
      respiratoryRate: parseInt(formData.respiratoryRate),
      gcsScore: parseInt(formData.gcsScore) || 14,
      lactateLevel: parseFloat(formData.lactateLevel) || 2.0
    }

    const result = await createPatient(patientData)

    if (result.success) {
      const riskLevel = result.patient.prediction?.riskLevel || 'Unknown'
      toast.success(`Patient submitted - ${riskLevel} risk predicted`, {
        duration: 5000,
        icon: riskLevel === 'Critical' ? '⚠️' : '✅'
      })
      navigate(`/patient/${result.patient._id}`)
    } else {
      toast.error(result.error)
    }
  }

  // Quick fill for demo
  const fillDemoData = () => {
    setFormData({
      age: '65',
      gender: 'Male',
      heartRate: '110',
      bloodPressureSystolic: '160',
      bloodPressureDiastolic: '95',
      oxygenSaturation: '91',
      temperature: '38.5',
      respiratoryRate: '24',
      gcsScore: '13',
      lactateLevel: '3.2',
      location: 'Highway 101, Mile 45',
      notes: 'Patient found unconscious. Suspected cardiac event. Responsive to pain.'
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Submit Patient Data</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">Enter patient vital signs for ICU risk prediction</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <BeakerIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600" />
            Patient Information
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="input"
                placeholder="65"
                min="0"
                max="150"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="card">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500" />
            Vital Signs
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heart Rate (bpm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="heartRate"
                value={formData.heartRate}
                onChange={handleChange}
                className="input"
                placeholder="80"
                min="0"
                max="300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Systolic BP (mmHg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="bloodPressureSystolic"
                value={formData.bloodPressureSystolic}
                onChange={handleChange}
                className="input"
                placeholder="120"
                min="0"
                max="300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diastolic BP (mmHg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="bloodPressureDiastolic"
                value={formData.bloodPressureDiastolic}
                onChange={handleChange}
                className="input"
                placeholder="80"
                min="0"
                max="200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SpO2 (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="oxygenSaturation"
                value={formData.oxygenSaturation}
                onChange={handleChange}
                className="input"
                placeholder="98"
                min="0"
                max="100"
                step="0.1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (°C) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                className="input"
                placeholder="37.0"
                min="20"
                max="50"
                step="0.1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Respiratory Rate (/min) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="respiratoryRate"
                value={formData.respiratoryRate}
                onChange={handleChange}
                className="input"
                placeholder="16"
                min="0"
                max="100"
                required
              />
            </div>
          </div>
        </div>

        {/* Additional Clinical Data */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Additional Clinical Data (Optional)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GCS Score (3-15)
              </label>
              <input
                type="number"
                name="gcsScore"
                value={formData.gcsScore}
                onChange={handleChange}
                className="input"
                placeholder="14"
                min="3"
                max="15"
              />
              <p className="text-xs text-gray-500 mt-1">Glasgow Coma Scale</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lactate Level (mmol/L)
              </label>
              <input
                type="number"
                name="lactateLevel"
                value={formData.lactateLevel}
                onChange={handleChange}
                className="input"
                placeholder="2.0"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Location and Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPinIcon className="w-5 h-5 mr-2 text-blue-500" />
            Location & Notes
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input"
                placeholder="123 Main St, City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <DocumentTextIcon className="w-4 h-4 mr-1" />
                Paramedic Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="input"
                placeholder="Additional observations, symptoms, medical history..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={fillDemoData}
            className="btn-secondary w-full sm:w-auto"
          >
            Fill Demo Data
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1 sm:flex-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1 sm:flex-none sm:px-8"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span className="hidden sm:inline">Analyzing...</span>
                  <span className="sm:hidden">...</span>
                </span>
              ) : (
                <>
                  <span className="hidden sm:inline">Submit & Analyze</span>
                  <span className="sm:hidden">Submit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default SubmitPatient
