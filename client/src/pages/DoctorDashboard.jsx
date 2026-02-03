/**
 * Doctor Dashboard
 * Real-time patient monitoring and management
 */
import { useEffect, useState } from 'react'
import { 
  UserGroupIcon, 
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { usePatientStore } from '../store/patientStore'
import { PatientCard, LoadingSpinner, StatsCard } from '../components'

const DoctorDashboard = () => {
  const { user } = useAuthStore()
  const { patients, stats, isLoading, fetchPatients, fetchStats } = usePatientStore()
  const [filter, setFilter] = useState('all')
  const [newPatientIds, setNewPatientIds] = useState(new Set())

  useEffect(() => {
    fetchPatients({ limit: 50 })
    fetchStats()
    
    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchPatients({ limit: 50 })
      fetchStats()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Track new patients for animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      setNewPatientIds(new Set())
    }, 5000)
    return () => clearTimeout(timeout)
  }, [patients.length])

  // Filter patients
  const filteredPatients = patients.filter(patient => {
    if (filter === 'all') return true
    if (filter === 'critical') return patient.prediction?.riskLevel === 'Critical'
    if (filter === 'high') return patient.prediction?.riskLevel === 'High'
    if (filter === 'incoming') return patient.status === 'Incoming'
    if (filter === 'icu') return patient.prediction?.needsICU
    return true
  })

  // Sort by priority (critical first)
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const riskOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 }
    const aRisk = riskOrder[a.prediction?.riskLevel] ?? 4
    const bRisk = riskOrder[b.prediction?.riskLevel] ?? 4
    if (aRisk !== bRisk) return aRisk - bRisk
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold">Doctor Dashboard</h1>
        <p className="text-green-100 mt-1 text-sm sm:text-base">Real-time patient monitoring • {user?.department || 'Emergency'}</p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total Patients"
          value={stats?.totalPatients || patients.length}
          subtitle="All time"
          icon={UserGroupIcon}
          color="blue"
        />
        <StatsCard
          title="Today's Patients"
          value={stats?.todayPatients || 0}
          icon={ChartBarIcon}
          color="purple"
        />
        <StatsCard
          title="Critical Cases"
          value={stats?.criticalPatients || 0}
          subtitle="Needs immediate attention"
          icon={ExclamationTriangleIcon}
          color="red"
        />
        <StatsCard
          title="High Risk"
          value={stats?.highRiskPatients || 0}
          icon={ClipboardDocumentCheckIcon}
          color="orange"
        />
      </div>

      {/* Risk distribution */}
      {stats?.riskDistribution && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="flex items-center space-x-4">
            {Object.entries(stats.riskDistribution).map(([level, count]) => {
              const colors = {
                'Critical': 'bg-red-500',
                'High': 'bg-orange-500',
                'Medium': 'bg-yellow-500',
                'Low': 'bg-green-500'
              }
              const total = Object.values(stats.riskDistribution).reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0
              
              return (
                <div key={level} className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-600">{level}</span>
                    <span className="text-sm text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[level] || 'bg-gray-400'} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Patient list */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Live Patient Queue
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({sortedPatients.length} patients)
            </span>
          </h2>
          
          {/* Filter buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-1 px-1">
            <FunnelIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {[
              { value: 'all', label: 'All' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'incoming', label: 'Incoming' },
              { value: 'icu', label: 'ICU' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${
                  filter === option.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && patients.length === 0 ? (
          <div className="card">
            <LoadingSpinner className="py-8" />
          </div>
        ) : sortedPatients.length === 0 ? (
          <div className="card text-center py-8 sm:py-12">
            <UserGroupIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-sm text-gray-500">
              {filter !== 'all' 
                ? 'Try changing the filter to see more patients'
                : 'Patients will appear here when submitted by paramedics'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {sortedPatients.map(patient => (
              <PatientCard 
                key={patient._id} 
                patient={patient}
                isNew={newPatientIds.has(patient._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorDashboard
