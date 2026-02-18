const Message = require('../models/Message');

module.exports = (io, socket, users) => {
    // CALL USER
    // CALL USER
    socket.on('call-user', (data) => {
        // data: { from, to, signal, name, type }
        const receiverSocketId = users.get(data.to);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('call-user', {
                from: data.from,
                signal: data.signal,
                name: data.name,
                type: data.type // 'video' or 'audio'
            });
            console.log(`Call request (${data.type}) from ${data.from} to ${data.to}`);
        }
    });

    socket.on('call-accepted', (data) => {
        // data: { from, to } - 'from' is the one accepting (callee), 'to' is caller
        const callerSocketId = users.get(data.to);
        if (callerSocketId) {
            io.to(callerSocketId).emit('call-accepted', { from: data.from });
        }
    });

    socket.on('call-rejected', (data) => {
        const callerSocketId = users.get(data.to);
        if (callerSocketId) {
            io.to(callerSocketId).emit('call-rejected', { from: data.from });
        }
    });

    socket.on('webrtc-offer', (data) => {
        const socketId = users.get(data.to);
        if (socketId) {
            io.to(socketId).emit('webrtc-offer', { from: data.from, offer: data.offer });
        }
    });

    socket.on('webrtc-answer', (data) => {
        const socketId = users.get(data.to);
        if (socketId) {
            io.to(socketId).emit('webrtc-answer', { from: data.from, answer: data.answer });
        }
    });

    socket.on('ice-candidate', (data) => {
        const socketId = users.get(data.to);
        if (socketId) {
            io.to(socketId).emit('ice-candidate', { from: data.from, candidate: data.candidate });
        }
    });

    socket.on('end-call', async (data) => {
        const socketId = users.get(data.to);
        if (socketId) {
            io.to(socketId).emit('end-call', { from: data.from });
        }

        // Save Call History
        // data.from = user who ended the call? Or do we rely on the context? 
        // Usually 'end-call' is sent by one peer. 
        // We'll create a message from the sender to value 'to'.
        // This is a simplification. Ideally, we track start/end time.
        // For now, just log "Call Ended"
        try {
            if (data.from && data.to) {
                // Find IDs if possible, or assume they are IDs. 
                // socket.on('call-user', { from: socket.userId, ... }) so these are probably userIds.

                await Message.create({
                    sender: data.from,
                    receiver: data.to,
                    content: data.callType === 'audio' ? 'Audio Call ended' : 'Video Call ended',
                    type: data.callType === 'audio' ? 'audio_call' : 'video_call',
                    callDuration: 0
                });
            }
        } catch (err) {
            console.error('Error saving call history:', err);
        }
    });
};
