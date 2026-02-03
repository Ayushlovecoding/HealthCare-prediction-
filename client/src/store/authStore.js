/**
 * Authentication Store
 * Zustand store for managing authentication state
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../api/auth'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authAPI.login(credentials)
          const { user, token } = response.data
          
          localStorage.setItem('token', token)
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          return { success: true, user }
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },
      
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authAPI.register(userData)
          const { user, token } = response.data
          
          localStorage.setItem('token', token)
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          return { success: true, user }
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },
      
      logout: () => {
        localStorage.removeItem('token')
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },
      
      checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null })
          return false
        }
        
        try {
          const response = await authAPI.verifyToken()
          set({
            user: response.data.user,
            token,
            isAuthenticated: true
          })
          return true
        } catch (error) {
          localStorage.removeItem('token')
          set({ isAuthenticated: false, user: null, token: null })
          return false
        }
      },
      
      updateProfile: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authAPI.updateProfile(data)
          set({
            user: response.data.user,
            isLoading: false
          })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Update failed'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export default useAuthStore
