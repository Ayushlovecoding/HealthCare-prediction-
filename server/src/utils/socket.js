/**
 * Socket.IO Event Handler
 * Manages real-time WebSocket connections and events
 */

// Store connected clients
const connectedClients = new Map();

/**
 * Initialize Socket.IO handlers
 * @param {Server} io - Socket.IO server instance
 */
const initializeSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Store client info
    connectedClients.set(socket.id, {
      id: socket.id,
      connectedAt: new Date(),
      user: null,
      rooms: []
    });

    // Handle user authentication via socket
    socket.on('authenticate', (userData) => {
      const client = connectedClients.get(socket.id);
      if (client) {
        client.user = userData;
        
        // Join role-specific room
        if (userData.role) {
          socket.join(`role:${userData.role}`);
          client.rooms.push(`role:${userData.role}`);
        }
        
        console.log(`👤 User authenticated on socket: ${userData.name} (${userData.role})`);
      }
    });

    // Handle joining specific rooms (e.g., patient-specific updates)
    socket.on('join:room', (roomName) => {
      socket.join(roomName);
      const client = connectedClients.get(socket.id);
      if (client) {
        client.rooms.push(roomName);
      }
      console.log(`📍 Socket ${socket.id} joined room: ${roomName}`);
    });

    // Handle leaving rooms
    socket.on('leave:room', (roomName) => {
      socket.leave(roomName);
      const client = connectedClients.get(socket.id);
      if (client) {
        client.rooms = client.rooms.filter(r => r !== roomName);
      }
      console.log(`📍 Socket ${socket.id} left room: ${roomName}`);
    });

    // Handle dashboard subscription
    socket.on('subscribe:dashboard', () => {
      socket.join('dashboard');
      console.log(`📊 Socket ${socket.id} subscribed to dashboard updates`);
    });

    // Handle patient subscription
    socket.on('subscribe:patient', (patientId) => {
      socket.join(`patient:${patientId}`);
      console.log(`🏥 Socket ${socket.id} subscribed to patient ${patientId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      const client = connectedClients.get(socket.id);
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
      
      // Log user if authenticated
      if (client && client.user) {
        console.log(`👤 User ${client.user.name} disconnected`);
      }
      
      connectedClients.delete(socket.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error);
    });
  });

  console.log('✅ Socket.IO handlers initialized');
};

/**
 * Emit new patient event to all connected dashboards
 * @param {Server} io - Socket.IO server instance
 * @param {Object} patient - Patient data
 */
const emitNewPatient = (io, patient) => {
  io.to('dashboard').emit('patient:new', {
    type: 'NEW_PATIENT',
    data: patient,
    timestamp: new Date().toISOString()
  });
  
  // Also emit to doctors specifically for high-risk patients
  if (patient.prediction && patient.prediction.riskLevel === 'Critical') {
    io.to('role:DOCTOR').emit('alert:critical', {
      type: 'CRITICAL_PATIENT',
      data: patient,
      message: `⚠️ Critical patient incoming: ${patient.prediction.riskLevel} risk`,
      timestamp: new Date().toISOString()
    });
  }
  
  console.log(`📢 Emitted new patient event: ${patient._id}`);
};

/**
 * Emit patient update event
 * @param {Server} io - Socket.IO server instance
 * @param {Object} patient - Updated patient data
 */
const emitPatientUpdate = (io, patient) => {
  // Emit to dashboard
  io.to('dashboard').emit('patient:updated', {
    type: 'PATIENT_UPDATED',
    data: patient,
    timestamp: new Date().toISOString()
  });
  
  // Emit to specific patient room
  io.to(`patient:${patient._id}`).emit('patient:updated', {
    type: 'PATIENT_UPDATED',
    data: patient,
    timestamp: new Date().toISOString()
  });
  
  console.log(`📢 Emitted patient update event: ${patient._id}`);
};

/**
 * Emit patient status change
 * @param {Server} io - Socket.IO server instance
 * @param {Object} patient - Patient data
 * @param {string} oldStatus - Previous status
 */
const emitStatusChange = (io, patient, oldStatus) => {
  io.to('dashboard').emit('patient:status', {
    type: 'STATUS_CHANGE',
    data: {
      patientId: patient._id,
      oldStatus,
      newStatus: patient.status,
      patient
    },
    timestamp: new Date().toISOString()
  });
  
  console.log(`📢 Emitted status change: ${patient._id} (${oldStatus} -> ${patient.status})`);
};

/**
 * Get connected clients count
 */
const getConnectedCount = () => connectedClients.size;

/**
 * Get connected clients info
 */
const getConnectedClients = () => {
  return Array.from(connectedClients.values()).map(client => ({
    id: client.id,
    connectedAt: client.connectedAt,
    user: client.user ? { name: client.user.name, role: client.user.role } : null,
    rooms: client.rooms
  }));
};

module.exports = {
  initializeSocketHandlers,
  emitNewPatient,
  emitPatientUpdate,
  emitStatusChange,
  getConnectedCount,
  getConnectedClients
};
