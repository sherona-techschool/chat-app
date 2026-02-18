import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);


    const connectSocket = (userId) => {
        if (socket) return;

        const token = localStorage.getItem('token');


        const newSocket = io(import.meta.env.VITE_API_URL, {
            transports: ['websocket'],
            auth: { token }
        });

        newSocket.userId = userId;

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            setIsConnected(true);
            newSocket.emit('join', userId);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from socket server');
            setIsConnected(false);
        });

        setSocket(newSocket);
    };

    return (
        <SocketContext.Provider value={{ socket, connectSocket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export { SocketProvider, SocketContext };
