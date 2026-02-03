/**
 * Patient Details Page
 * Full patient information and prediction details
 */
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  HeartIcon,
  BeakerIcon,
  ChartBarIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { usePatientStore } from '../store/patientStore'
import { useAuthStore } from '../store/authStore'
import { LoadingSpinner } from '../components'
import toast from 'react-hot-toast'

const PatientDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentPatient, isLoading, fetchPatientById, updatePatient, assignDoctor, clearCurrentPatient } = usePatientStore()

  useEffect(() => {
    fetchPatientById(id)
    return () => clearCurrentPatient()
  }, [id])

  const handleStatusChange = async (newStatus) => {
    const result = await updatePatient(id, { status: newStatus })
    if (result.success) {
      toast.success(`Status updated to ${newStatus}`)
    } else {
      toast.error(result.error)
    }
  }

  const handleAssignToMe = async () => {
    const result = await assignDoctor(id)
    if (result.success) {
      toast.success('Patient assigned to you')
    } else {
      toast.error(result.error)
    }
  }

  if (isLoading || !currentPatient) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const patient = currentPatient
  const prediction = patient.prediction || {}
  
  const getRiskColor = (level) => {
    switch (level) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>
        
        {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && !patient.assignedDoctor && (
          <button onClick={handleAssignToMe} className="btn-primary">
            Assign to Me
          </button>
        )}
      </div>

      {/* Risk banner */}
      <div className={`card border-2 ${getRiskColor(prediction.riskLevel)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {prediction.needsICU && (
              <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {prediction.riskLevel || 'Unknown'} Risk
              </h2>
              <p className="text-lg">
                ICU Probability: {prediction.riskScore ? (prediction.riskScore * 100).toFixed(1) : 'N/A'}%
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm opacity-75">Confidence</p>
            <p className="text-xl font-bold">
              {prediction.confidence ? (prediction.confidence * 100).toFixed(0) : 'N/A'}%
            </p>
          </div>
        </div>
        
        {prediction.needsICU && (
          <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-200">
            <p className="text-red-800 font-medium">
              ⚠️ ICU admission recommended based on vital signs analysis
            </p>
          </div>
        )}
      </div>

      {/* Patient info and vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="w-5 h-5 mr-2 text-primary-600" />
            Patient Information
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Age</span>
              <span className="font-medium">{patient.age} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gender</span>
              <span className="font-medium">{patient.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <select
                value={patient.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={user?.role === 'PARAMEDIC'}
                className="input py-1 px-2 text-sm w-auto"
              >
                <option value="Incoming">Incoming</option>
                <option value="Triaged">Triaged</option>
                <option value="In Treatment">In Treatment</option>
                <option value="Admitted">Admitted</option>
                <option value="Discharged">Discharged</option>
                <option value="Transferred">Transferred</option>
              </select>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Priority</span>
              <span className="font-medium">{patient.priority}/5</span>
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <HeartIcon className="w-5 h-5 mr-2 text-red-500" />
            Vital Signs
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Heart Rate</p>
              <p className="text-xl font-bold text-gray-900">{patient.heartRate}</p>
              <p className="text-xs text-gray-400">bpm</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Blood Pressure</p>
              <p className="text-xl font-bold text-gray-900">
                {patient.bloodPressureSystolic}/{patient.bloodPressureDiastolic}
              </p>
              <p className="text-xs text-gray-400">mmHg</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">SpO2</p>
              <p className="text-xl font-bold text-gray-900">{patient.oxygenSaturation}</p>
              <p className="text-xs text-gray-400">%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Temperature</p>
              <p className="text-xl font-bold text-gray-900">{patient.temperature}</p>
              <p className="text-xs text-gray-400">°C</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Respiratory</p>
              <p className="text-xl font-bold text-gray-900">{patient.respiratoryRate}</p>
              <p className="text-xs text-gray-400">/min</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">GCS</p>
              <p className="text-xl font-bold text-gray-900">{patient.gcsScore || 14}</p>
              <p className="text-xs text-gray-400">/15</p>
            </div>
          </div>
        </div>
      </div>

      {/* ML Summary */}
      {prediction.generatedSummary && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2 text-purple-600" />
            AI Analysis Summary
          </h3>
          <p className="text-gray-700 leading-relaxed">{prediction.generatedSummary}</p>
          <p className="text-xs text-gray-400 mt-3">
            Model version: {prediction.modelVersion || 'v1.0'}
          </p>
        </div>
      )}

      {/* Location and Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patient.location && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPinIcon className="w-5 h-5 mr-2 text-blue-600" />
              Location
            </h3>
            <p className="text-gray-700">{patient.location}</p>
          </div>
        )}

        {patient.notes && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-green-600" />
              Paramedic Notes
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{patient.notes}</p>
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="card bg-gray-50">
        <div className="flex flex-wrap gap-6 text-sm text-gray-500">
          <div className="flex items-center">
            <ClockIcon className="w-4 h-4 mr-1" />
            Submitted: {formatDate(patient.createdAt)}
          </div>
          {patient.submittedBy && (
            <div>
              By: {patient.submittedBy.name} ({patient.submittedBy.role})
            </div>
          )}
          {patient.assignedDoctor && (
            <div>
              Assigned to: {patient.assignedDoctor.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PatientDetails
