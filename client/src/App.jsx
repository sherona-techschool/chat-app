import React, { useState } from 'react';
import Auth from './pages/Auth';
import Chat from './pages/Chat';
import './styles/theme.css';

function App() {
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUserId(null);
  };

  return (
    <div className="App">
      {!userId ? (
        <Auth onLogin={setUserId} />
      ) : (
        <Chat userId={userId} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
