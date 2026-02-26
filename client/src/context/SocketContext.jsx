
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = React.createContext();

const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null); 


  
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;              
        if (socketRef.current) return;    

        const newSocket = io(import.meta.env.VITE_API_URL, {
            transports: ['websocket'],
            auth: { token },
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            setIsConnected(true);
        });

        newSocket.on('user-id', ({ userId }) => {
            if (userId) newSocket.userId = userId;
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from socket server');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            socketRef.current = null;
        };
    }, []); 

   
    const connectSocket = (userId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('[Socket] No token found — cannot connect');
            return;
        }
        if (socketRef.current?.connected) return; 

        const newSocket = io(import.meta.env.VITE_API_URL, {
            transports: ['websocket'],
            auth: { token },
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            setIsConnected(true);
        });

        newSocket.on('user-id', ({ userId: serverUserId }) => {
            if (serverUserId) newSocket.userId = serverUserId;
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

export { SocketProvider };