/**
 * API Configuration and Axios Instance
 */
import axios from 'axios'

// Base URL for API requests
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response
      
      // Unauthorized - token expired or invalid
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      
      // Forbidden - insufficient permissions
      if (status === 403) {
        console.error('Access denied:', data.message)
      }
      
      // Server error
      if (status >= 500) {
        console.error('Server error:', data.message)
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
