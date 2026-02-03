import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layout
import Layout from './components/Layout'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ParamedicDashboard from './pages/ParamedicDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDetails from './pages/PatientDetails'
import SubmitPatient from './pages/SubmitPatient'
import NotFound from './pages/NotFound'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'DOCTOR') {
      return <Navigate to="/doctor" replace />
    }
    return <Navigate to="/paramedic" replace />
  }
  
  return children
}

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  
  if (isAuthenticated) {
    // Redirect to appropriate dashboard
    if (user?.role === 'DOCTOR' || user?.role === 'ADMIN') {
      return <Navigate to="/doctor" replace />
    }
    return <Navigate to="/paramedic" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Default redirect based on role handled in ProtectedRoute */}
        <Route index element={<Navigate to="/paramedic" replace />} />
        
        {/* Paramedic Routes */}
        <Route path="paramedic" element={
          <ProtectedRoute allowedRoles={['PARAMEDIC', 'DOCTOR', 'ADMIN']}>
            <ParamedicDashboard />
          </ProtectedRoute>
        } />
        <Route path="submit-patient" element={
          <ProtectedRoute allowedRoles={['PARAMEDIC', 'DOCTOR', 'ADMIN']}>
            <SubmitPatient />
          </ProtectedRoute>
        } />
        
        {/* Doctor Routes */}
        <Route path="doctor" element={
          <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } />
        
        {/* Shared Routes */}
        <Route path="patient/:id" element={
          <ProtectedRoute>
            <PatientDetails />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
