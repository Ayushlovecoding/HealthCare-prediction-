/**
 * Patient API Functions
 */
import api from './axios'

export const patientAPI = {
  /**
   * Create a new patient record
   */
  create: async (patientData) => {
    const response = await api.post('/patients', patientData)
    return response.data
  },
  
  /**
   * Get all patients with pagination
   */
  getAll: async (params = {}) => {
    const response = await api.get('/patients', { params })
    return response.data
  },
  
  /**
   * Get recent patients
   */
  getRecent: async (limit = 10) => {
    const response = await api.get('/patients/recent', { params: { limit } })
    return response.data
  },
  
  /**
   * Get patient statistics
   */
  getStats: async () => {
    const response = await api.get('/patients/stats')
    return response.data
  },
  
  /**
   * Get single patient by ID
   */
  getById: async (id) => {
    const response = await api.get(`/patients/${id}`)
    return response.data
  },
  
  /**
   * Update patient
   */
  update: async (id, data) => {
    const response = await api.put(`/patients/${id}`, data)
    return response.data
  },
  
  /**
   * Assign doctor to patient
   */
  assignDoctor: async (patientId, doctorId = null) => {
    const response = await api.put(`/patients/${patientId}/assign`, { doctorId })
    return response.data
  },
  
  /**
   * Delete patient (admin only)
   */
  delete: async (id) => {
    const response = await api.delete(`/patients/${id}`)
    return response.data
  }
}

export default patientAPI
