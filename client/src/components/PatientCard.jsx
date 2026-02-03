/**
 * Patient Card Component
 * Displays patient summary with risk indicator
 */
import { useNavigate } from 'react-router-dom'
import { 
  HeartIcon, 
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const PatientCard = ({ patient, isNew = false }) => {
  const navigate = useNavigate()

  const getRiskStyles = (riskLevel) => {
    switch (riskLevel) {
      case 'Critical':
        return {
          bg: 'bg-red-50 border-red-200',
          badge: 'badge-critical',
          icon: 'text-red-500',
          pulse: true
        }
      case 'High':
        return {
          bg: 'bg-orange-50 border-orange-200',
          badge: 'badge-high',
          icon: 'text-orange-500',
          pulse: false
        }
      case 'Medium':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          badge: 'badge-medium',
          icon: 'text-yellow-600',
          pulse: false
        }
      default:
        return {
          bg: 'bg-green-50 border-green-200',
          badge: 'badge-low',
          icon: 'text-green-500',
          pulse: false
        }
    }
  }

  const riskLevel = patient.prediction?.riskLevel || 'Unknown'
  const styles = getRiskStyles(riskLevel)
  const riskScore = patient.prediction?.riskScore 
    ? (patient.prediction.riskScore * 100).toFixed(1) 
    : 'N/A'

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div 
      className={`
        card border cursor-pointer transition-all hover:shadow-lg active:scale-98
        ${styles.bg}
        ${styles.pulse ? 'alert-pulse' : ''}
        ${isNew ? 'animate-slide-in' : ''}
      `}
      onClick={() => navigate(`/patient/${patient._id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <div className={`p-1.5 sm:p-2 rounded-full bg-white ${styles.icon} flex-shrink-0`}>
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
              {patient.age} y/o {patient.gender}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 flex items-center">
              <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{formatTime(patient.createdAt)}</span>
            </p>
          </div>
        </div>
        
        <div className="text-right flex-shrink-0">
          <span className={`${styles.badge} text-xs`}>
            {riskLevel}
          </span>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {riskScore}%
          </p>
        </div>
      </div>

      {/* Vitals summary */}
      <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="bg-white rounded-lg p-1.5 sm:p-2">
          <p className="text-xs text-gray-500">HR</p>
          <p className="font-semibold text-gray-900 text-sm">{patient.heartRate}</p>
        </div>
        <div className="bg-white rounded-lg p-1.5 sm:p-2">
          <p className="text-xs text-gray-500">BP</p>
          <p className="font-semibold text-gray-900 text-sm">
            {patient.bloodPressureSystolic}/{patient.bloodPressureDiastolic}
          </p>
        </div>
        <div className="bg-white rounded-lg p-1.5 sm:p-2">
          <p className="text-xs text-gray-500">SpO2</p>
          <p className="font-semibold text-gray-900 text-sm">{patient.oxygenSaturation}%</p>
        </div>
      </div>

      {/* Status and ICU prediction */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2">
        <span className={`
          text-xs font-medium px-2 py-1 rounded truncate
          ${patient.status === 'Incoming' ? 'bg-blue-100 text-blue-700' :
            patient.status === 'Triaged' ? 'bg-purple-100 text-purple-700' :
            patient.status === 'In Treatment' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'}
        `}>
          {patient.status}
        </span>
        
        {patient.prediction?.needsICU && (
          <span className="flex items-center text-xs text-red-600 font-medium flex-shrink-0">
            <ExclamationTriangleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">ICU Required</span>
            <span className="sm:hidden">ICU</span>
          </span>
        )}
      </div>

      {/* Submitter info */}
      {patient.submittedBy && (
        <p className="mt-2 text-xs text-gray-500 truncate">
          By: {patient.submittedBy.name || 'Unknown'}
        </p>
      )}
    </div>
  )
}

export default PatientCard
