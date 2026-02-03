/**
 * Main Layout Component
 * Provides navigation and structure for authenticated pages
 */
import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { 
  HomeIcon, 
  UserPlusIcon, 
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { useSocketStore } from '../store/socketStore'
import { usePatientStore } from '../store/patientStore'
import toast from 'react-hot-toast'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { connect, disconnect, onNewPatient, onCriticalAlert, isConnected } = useSocketStore()
  const { addPatient } = usePatientStore()

  // Connect to Socket.IO on mount
  useEffect(() => {
    if (user) {
      connect(user)
    }
    
    return () => {
      disconnect()
    }
  }, [user])

  // Set up real-time event listeners
  useEffect(() => {
    if (isConnected) {
      // Listen for new patients
      onNewPatient((data) => {
        console.log('New patient:', data)
        addPatient(data.data)
        
        // Show notification
        toast.success(`New patient incoming: ${data.data.prediction?.riskLevel || 'Unknown'} risk`, {
          duration: 5000,
          icon: '🚑'
        })
        
        setNotifications(prev => [
          { id: Date.now(), type: 'new', data: data.data },
          ...prev.slice(0, 9)
        ])
      })
      
      // Listen for critical alerts (doctors only)
      if (user?.role === 'DOCTOR' || user?.role === 'ADMIN') {
        onCriticalAlert((data) => {
          console.log('Critical alert:', data)
          toast.error(data.message, {
            duration: 10000,
            icon: '⚠️'
          })
        })
      }
    }
  }, [isConnected, user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigation = [
    ...(user?.role === 'PARAMEDIC' ? [
      { name: 'Dashboard', href: '/paramedic', icon: HomeIcon },
      { name: 'Submit Patient', href: '/submit-patient', icon: UserPlusIcon },
    ] : []),
    ...(user?.role === 'DOCTOR' || user?.role === 'ADMIN' ? [
      { name: 'Doctor Dashboard', href: '/doctor', icon: ClipboardDocumentListIcon },
      { name: 'Submit Patient', href: '/submit-patient', icon: UserPlusIcon },
    ] : []),
  ]

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 bg-primary-900 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary-800 font-bold text-xl">+</span>
              </div>
              <span className="text-white font-semibold">ER Platform</span>
            </div>
            <button 
              className="lg:hidden text-white p-2 -mr-2 touch-manipulation"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-primary-700 flex-shrink-0">
            <p className="text-primary-200 text-sm">Logged in as</p>
            <p className="text-white font-medium truncate">{user?.name}</p>
            <span className={`
              inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium
              ${user?.role === 'DOCTOR' ? 'bg-green-500 text-white' : 
                user?.role === 'ADMIN' ? 'bg-purple-500 text-white' : 
                'bg-blue-500 text-white'}
            `}>
              {user?.role}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary-700 text-white' 
                    : 'text-primary-200 hover:bg-primary-700 hover:text-white'}
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Connection status */}
          <div className="px-4 py-2 border-t border-primary-700 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-primary-300 text-xs">
                {isConnected ? 'Real-time connected' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-primary-700 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-primary-200 hover:text-white hover:bg-primary-700 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
            <button
              className="lg:hidden text-gray-600 p-2 -ml-2 touch-manipulation"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            {/* Notifications */}
            <div className="relative">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 touch-manipulation" aria-label="Notifications">
                <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t py-3 sm:py-4 px-4 sm:px-6 text-center text-xs sm:text-sm text-gray-500 flex-shrink-0">
          Emergency Healthcare Platform © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}

export default Layout
