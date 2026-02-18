import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SocketProvider } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import './styles/theme.css'; // Import global styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SocketProvider>
      <CallProvider>
        <App />
      </CallProvider>
    </SocketProvider>
  </React.StrictMode>
);
