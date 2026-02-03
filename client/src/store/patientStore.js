/**
 * Patient Store
 * Zustand store for managing patient data and real-time updates
 */
import { create } from 'zustand'
import { patientAPI } from '../api/patients'

export const usePatientStore = create((set, get) => ({
  // State
  patients: [],
  currentPatient: null,
  stats: null,
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  },
  
  // Actions
  fetchPatients: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await patientAPI.getAll(params)
      set({
        patients: response.data.patients,
        pagination: response.data.pagination,
        isLoading: false
      })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch patients'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },
  
  fetchRecentPatients: async (limit = 10) => {
    set({ isLoading: true, error: null })
    try {
      const response = await patientAPI.getRecent(limit)
      set({
        patients: response.data.patients,
        isLoading: false
      })
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch patients'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },
  
  fetchStats: async () => {
    try {
      const response = await patientAPI.getStats()
      set({ stats: response.data })
      return { success: true }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      return { success: false }
    }
  },
  
  fetchPatientById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await patientAPI.getById(id)
      set({
        currentPatient: response.data.patient,
        isLoading: false
      })
      return { success: true, patient: response.data.patient }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch patient'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },
  
  createPatient: async (patientData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await patientAPI.create(patientData)
      const newPatient = response.data.patient
      
      // Add to list
      set(state => ({
        patients: [newPatient, ...state.patients],
        isLoading: false
      }))
      
      return { success: true, patient: newPatient }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create patient'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },
  
  updatePatient: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await patientAPI.update(id, data)
      const updatedPatient = response.data.patient
      
      // Update in list
      set(state => ({
        patients: state.patients.map(p => 
          p._id === id ? updatedPatient : p
        ),
        currentPatient: state.currentPatient?._id === id 
          ? updatedPatient 
          : state.currentPatient,
        isLoading: false
      }))
      
      return { success: true, patient: updatedPatient }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update patient'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },
  
  assignDoctor: async (patientId, doctorId) => {
    try {
      const response = await patientAPI.assignDoctor(patientId, doctorId)
      const updatedPatient = response.data.patient
      
      // Update in list
      set(state => ({
        patients: state.patients.map(p => 
          p._id === patientId ? updatedPatient : p
        ),
        currentPatient: state.currentPatient?._id === patientId 
          ? updatedPatient 
          : state.currentPatient
      }))
      
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to assign doctor'
      return { success: false, error: message }
    }
  },
  
  // Real-time update handlers
  addPatient: (patient) => {
    set(state => ({
      patients: [patient, ...state.patients.filter(p => p._id !== patient._id)]
    }))
  },
  
  updatePatientInList: (patient) => {
    set(state => ({
      patients: state.patients.map(p => 
        p._id === patient._id ? patient : p
      ),
      currentPatient: state.currentPatient?._id === patient._id 
        ? patient 
        : state.currentPatient
    }))
  },
  
  clearCurrentPatient: () => set({ currentPatient: null }),
  clearError: () => set({ error: null })
}))

export default usePatientStore
