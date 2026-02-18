const chatSocket = require('./chat.socket');
const callSocket = require('./call.socket');
const { consumeMessage } = require('../rabbitmq/consumer');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'super-secret-key-change-in-prod';

// Tracking online users for UI status updates
const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
    // Middleware for Socket Authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) return next(new Error('Authentication error'));
            socket.decoded = decoded; // { userId, email }
            next();
        });
    });

    // Start RabbitMQ Consumer for Chat Messages
    // Only start once, or ensure logic handles duplicates if this module is reloaded
    consumeMessage('chat_messages', (data) => {
        // data: { from, to, message, timestamp }
        const { to, from, message, timestamp } = data;
        console.log(`Consuming message for ${to} from ${from}: ${message}`);

        // Emit to the specific room named by userId
        io.to(to).emit('receive-message', { from, message, timestamp });
    });

    io.on('connection', (socket) => {
        const userId = socket.decoded.userId;
        console.log(`User connected: ${userId} (Socket: ${socket.id})`);

        // Join a room with their own userId for targeted delivery
        socket.join(userId);
        onlineUsers.set(userId, socket.id);

        // Register handlers (pass onlineUsers for simple lookups if needed)
        chatSocket(io, socket, onlineUsers);
        callSocket(io, socket, onlineUsers);

        // Broadcast online status
        io.emit('users-online', Array.from(onlineUsers.keys()));

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${userId}`);
            onlineUsers.delete(userId);
            io.emit('users-online', Array.from(onlineUsers.keys()));
        });
    });
};
