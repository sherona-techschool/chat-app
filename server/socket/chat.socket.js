const { publishMessage } = require('../rabbitmq/producer');
const Message = require('../models/Message');
const mongoose = require('mongoose');

module.exports = (io, socket, users) => {
    // SEND MESSAGE
    socket.on('send-message', async ({ to, message, type = 'text', fileUrl = '' }) => {
        try {
            const from = socket.decoded.userId; 

            if (!to || !mongoose.isValidObjectId(to)) {
                console.error(`Invalid receiver ID: ${to}`);
                return;
            }

            const msgData = { from, to, message, type, fileUrl, timestamp: new Date() };
            console.log(`User ${from} sending ${type} to ${to}`);

            // Persist to MongoDB
            try {
                const savedMsg = await Message.create({
                    sender: from,
                    receiver: to,
                    content: message || 'Image', // Fallback text for notifications
                    type,
                    fileUrl,
                    delivered: true
                });
                console.log('DEBUG: Message saved to DB:', savedMsg._id);
            } catch (dbError) {
                console.error('DEBUG: DB Save Error:', dbError);
            }

            // Publish to RabbitMQ for delivery
            publishMessage('chat_messages', msgData);

            // Ack to sender
            socket.emit('message-ack', {
                tempId: null,
                messageId: null,
                status: 'sent'
            });

        } catch (error) {
            console.error('Error handling send-message:', error);
            socket.emit('message-ack', {
                status: 'error',
                error: error.message
            });
        }
    });

    // TYPING INDICATORS
    socket.on('typing', ({ to }) => {
        io.to(to).emit('typing', { from: socket.decoded.userId });
    });

    socket.on('stop-typing', ({ to }) => {
        io.to(to).emit('stop-typing', { from: socket.decoded.userId });
    });
};
