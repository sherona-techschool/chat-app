import React, { useState, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import '../styles/theme.css';

const Login = ({ onLogin }) => {
    const [userId, setUserId] = useState('');
    const { connectSocket } = useContext(SocketContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!userId) return;

        // In a real app, call API to login.
        // Here just set state and connect socket.
        connectSocket(userId);
        onLogin(userId);
    };

    return (
        <div className="auth-container">
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'center',
                width: '400px'
            }}>
                <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>WhatsApp Video Chat</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="text"
                        placeholder="Enter your Username (e.g., UserA)"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="input-field"
                    />
                    <button type="submit" className="btn btn-primary">Login</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
