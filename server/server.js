require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectRabbitMQ } = require('./rabbitmq/connection');
const connectDB = require('./config/db');
const socketInit = require('./socket/index');
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

app.use('/api/auth', authRoutes);
console.log('Mounting Chat Routes at /api...');
app.use('/api', chatRoutes);

app.get('/test', (req, res) => {
    res.send('Server is working!');
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Initialize Socket.IO and RabbitMQ
connectDB();
connectRabbitMQ().then(() => {
    console.log('RabbitMQ connected');
    socketInit(io);
}).catch(err => {
    console.error('Failed to connect to RabbitMQ', err);
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


