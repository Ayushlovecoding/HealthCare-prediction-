/**
 * Socket.IO Store
 * Manages real-time WebSocket connections
 */
import { create } from 'zustand'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const useSocketStore = create((set, get) => ({
  // State
  socket: null,
  isConnected: false,
  lastEvent: null,
  
  // Actions
  connect: (userData) => {
    const { socket } = get()
    
    // Don't reconnect if already connected
    if (socket?.connected) {
      return
    }
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected')
      set({ isConnected: true })
      
      // Authenticate with user data
      if (userData) {
        newSocket.emit('authenticate', userData)
      }
      
      // Subscribe to dashboard updates
      newSocket.emit('subscribe:dashboard')
    })
    
    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
      set({ isConnected: false })
    })
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      set({ isConnected: false })
    })
    
    set({ socket: newSocket })
    
    return newSocket
  },
  
  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null, isConnected: false })
    }
  },
  
  // Subscribe to events
  onNewPatient: (callback) => {
    const { socket } = get()
    if (socket) {
      socket.on('patient:new', (data) => {
        set({ lastEvent: { type: 'new', data, timestamp: Date.now() } })
        callback(data)
      })
    }
  },
  
  onPatientUpdated: (callback) => {
    const { socket } = get()
    if (socket) {
      socket.on('patient:updated', (data) => {
        set({ lastEvent: { type: 'updated', data, timestamp: Date.now() } })
        callback(data)
      })
    }
  },
  
  onCriticalAlert: (callback) => {
    const { socket } = get()
    if (socket) {
      socket.on('alert:critical', (data) => {
        set({ lastEvent: { type: 'critical', data, timestamp: Date.now() } })
        callback(data)
      })
    }
  },
  
  onStatusChange: (callback) => {
    const { socket } = get()
    if (socket) {
      socket.on('patient:status', (data) => {
        callback(data)
      })
    }
  },
  
  // Subscribe to specific patient
  subscribeToPatient: (patientId) => {
    const { socket } = get()
    if (socket) {
      socket.emit('subscribe:patient', patientId)
    }
  },
  
  // Unsubscribe from all listeners
  removeAllListeners: () => {
    const { socket } = get()
    if (socket) {
      socket.off('patient:new')
      socket.off('patient:updated')
      socket.off('alert:critical')
      socket.off('patient:status')
    }
  }
}))

export default useSocketStore
