let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user_${userId}`);
      }
    });

    // Join role room (student, teacher, tg, hod, admin)
    socket.on('join_role', (role) => {
      if (role) {
        socket.join(`role_${role.toLowerCase()}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined role_${role}`);
      }
    });

    // Join section room (e.g. 'CSE-3A')
    socket.on('join_section', (section) => {
      if (section) {
        socket.join(`section_${section}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined section_${section}`);
      }
    });

    // Handle ping/liveness
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => ioInstance;

const emitNotification = (recipientRoleOrId, notification) => {
  if (!ioInstance) return;

  // Emit to role room or specific user room
  if (['student', 'teacher', 'tg', 'hod', 'admin'].includes(recipientRoleOrId.toLowerCase())) {
    ioInstance.to(`role_${recipientRoleOrId.toLowerCase()}`).emit('new_notification', notification);
  } else {
    ioInstance.to(`user_${recipientRoleOrId}`).emit('new_notification', notification);
  }
  
  // Also broadcast general event
  ioInstance.emit('notification_broadcast', notification);
};

const emitAttendanceUpdate = (section, payload) => {
  if (!ioInstance) return;
  ioInstance.to(`section_${section}`).emit('attendance_updated', payload);
  ioInstance.to('role_teacher').emit('attendance_updated', payload);
  ioInstance.to('role_hod').emit('attendance_updated', payload);
};

const emitLeaveUpdate = (payload) => {
  if (!ioInstance) return;
  ioInstance.to('role_tg').emit('leave_updated', payload);
  ioInstance.to('role_hod').emit('leave_updated', payload);
  if (payload.studentId) {
    ioInstance.to(`user_${payload.studentId}`).emit('leave_updated', payload);
  }
};

const emitTimetableUpdate = (section, payload) => {
  if (!ioInstance) return;
  if (section) {
    ioInstance.to(`section_${section}`).emit('timetable_updated', payload);
  }
  ioInstance.emit('timetable_updated', payload);
};

const emitAgentStep = (channel, stepPayload) => {
  if (!ioInstance) return;
  ioInstance.emit(`agent_step_${channel}`, stepPayload);
};

module.exports = {
  initSocket,
  getIO,
  emitNotification,
  emitAttendanceUpdate,
  emitLeaveUpdate,
  emitTimetableUpdate,
  emitAgentStep
};
