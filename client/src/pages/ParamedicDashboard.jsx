/**
 * Paramedic Dashboard
 * Overview for paramedics with recent submissions
 */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  UserPlusIcon, 
  ClipboardDocumentListIcon,
  ClockIcon,
  TruckIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { usePatientStore } from '../store/patientStore'
import { PatientCard, LoadingSpinner, StatsCard } from '../components'

const ParamedicDashboard = () => {
  const { user } = useAuthStore()
  const { patients, isLoading, fetchPatients } = usePatientStore()

  useEffect(() => {
    // Fetch patients submitted by this paramedic
    fetchPatients({ myPatients: 'true', limit: 10 })
  }, [])

  // Count patients by status
  const incomingCount = patients.filter(p => p.status === 'Incoming').length
  const triagedCount = patients.filter(p => p.status === 'Triaged').length
  const criticalCount = patients.filter(p => p.prediction?.riskLevel === 'Critical').length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold">{user?.name}</h1>
        <p className="text-primary-100 mt-1 text-sm sm:text-base">Paramedic Dashboard - Quick patient submission</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Link 
          to="/submit-patient"
          className="card border-2 border-dashed border-primary-300 hover:border-primary-500 hover:bg-primary-50 transition-all group"
        >
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-3 sm:p-4 bg-primary-100 rounded-lg sm:rounded-xl group-hover:bg-primary-200 transition-colors flex-shrink-0">
              <UserPlusIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Submit New Patient</h3>
              <p className="text-sm text-gray-500 truncate">Enter patient vitals for ICU prediction</p>
            </div>
          </div>
        </Link>

        <div className="card bg-orange-50 border border-orange-200">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-3 sm:p-4 bg-orange-100 rounded-lg sm:rounded-xl flex-shrink-0">
              <TruckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">{incomingCount} Active Transports</h3>
              <p className="text-sm text-gray-500 truncate">Patients currently en route</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatsCard
          title="My Submissions Today"
          value={patients.length}
          icon={ClipboardDocumentListIcon}
          color="blue"
        />
        <StatsCard
          title="Critical Patients"
          value={criticalCount}
          icon={ClockIcon}
          color="red"
        />
        <StatsCard
          title="Triaged"
          value={triagedCount}
          icon={ClipboardDocumentListIcon}
          color="green"
        />
      </div>

      {/* Recent submissions */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">My Recent Submissions</h2>
          <Link to="/submit-patient" className="btn-primary text-sm w-full sm:w-auto text-center">
            + New Patient
          </Link>
        </div>

        {isLoading ? (
          <div className="card">
            <LoadingSpinner className="py-8" />
          </div>
        ) : patients.length === 0 ? (
          <div className="card text-center py-12">
            <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients submitted yet</h3>
            <p className="text-gray-500 mb-4">Submit your first patient to see them here</p>
            <Link to="/submit-patient" className="btn-primary">
              Submit Patient
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map(patient => (
              <PatientCard key={patient._id} patient={patient} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ParamedicDashboard
