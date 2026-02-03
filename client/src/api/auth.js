/**
 * Authentication API Functions
 */
import api from './axios'

export const authAPI = {
  /**
   * Register a new user
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },
  
  /**
   * Login user
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },
  
  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
  
  /**
   * Update user profile
   */
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data)
    return response.data
  },
  
  /**
   * Change password
   */
  changePassword: async (data) => {
    const response = await api.put('/auth/password', data)
    return response.data
  },
  
  /**
   * Verify token
   */
  verifyToken: async () => {
    const response = await api.get('/auth/verify')
    return response.data
  },
  
  /**
   * Logout (client-side)
   */
  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  }
}

export default authAPI
