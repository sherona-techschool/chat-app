
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = React.createContext();

const SocketProvider = ({ children }) => {
    const [socket,      setSocket]      = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [myMongoId,   setMyMongoId]   = useState(null); // ✅ KEY FIX: stored in state
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
            console.log('[Socket] Connected:', newSocket.id);
            setIsConnected(true);
        });

        // ✅ Captured here IMMEDIATELY on connect — before CallContext even mounts
        // Previously only stored on newSocket.userId — CallContext could never read it
        newSocket.on('user-id', ({ userId }) => {
            if (userId) {
                console.log('[Socket] ✅ user-id received:', userId);
                newSocket.userId = userId;
                setMyMongoId(userId); // ✅ triggers re-render → CallContext syncs via useEffect
            }
        });

        newSocket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
            setMyMongoId(null);
        });

        newSocket.on('connect_error', (err) => {
            console.error('[Socket] connect_error:', err.message);
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            socketRef.current = null;
        };
    }, []);

    const connectSocket = () => {
        const token = localStorage.getItem('token');
        if (!token) { console.warn('[Socket] No token'); return; }
        if (socketRef.current?.connected) return;

        const newSocket = io(import.meta.env.VITE_API_URL, {
            transports: ['websocket'],
            auth: { token },
        });

        socketRef.current = newSocket;
        newSocket.on('connect',    ()           => setIsConnected(true));
        newSocket.on('user-id',    ({ userId }) => { if (userId) { newSocket.userId = userId; setMyMongoId(userId); } });
        newSocket.on('disconnect', ()           => { setIsConnected(false); setMyMongoId(null); });
        setSocket(newSocket);
    };

    return (
        // ✅ myMongoId now available to CallContext via useContext(SocketContext)
        <SocketContext.Provider value={{ socket, connectSocket, isConnected, myMongoId }}>
            {children}
        </SocketContext.Provider>
    );
};

export { SocketProvider };