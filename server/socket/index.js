const chatSocket = require('./chat.socket');
const callSocket = require('./call.socket');
const { consumeMessage } = require('../rabbitmq/consumer');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'super-secret-key-change-in-prod';


const onlineUsers = new Map(); 

module.exports = (io) => {
   
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) return next(new Error('Authentication error'));
            socket.decoded = decoded; 
            next();
        });
    });

    consumeMessage('chat_messages', (data) => {
    
        const { to, from, message, timestamp } = data;
        console.log(`Consuming message for ${to} from ${from}: ${message}`);

        io.to(to).emit('receive-message', { from, message, timestamp });
    });

    io.on('connection', (socket) => {
        const userId = socket.decoded.userId;
        const roomId = String(userId);
        console.log(`User connected: ${userId} (Socket: ${socket.id})`);

        
        socket.join(roomId);
        onlineUsers.set(roomId, socket.id);

       
        socket.emit('user-id', { userId: roomId });

        
        chatSocket(io, socket, onlineUsers);
        callSocket(io, socket, onlineUsers);

   
        io.emit('users-online', Array.from(onlineUsers.keys()));

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${userId}`);
            onlineUsers.delete(roomId);
            io.emit('users-online', Array.from(onlineUsers.keys()));
        });
    });
};
