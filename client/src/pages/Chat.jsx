import React, { useState, useEffect, useContext, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { CallContext } from '../context/CallContext';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import VideoCallModal from '../components/VideoCallModal';
import NavRail from '../components/NavRail';
import ProfileModal from '../components/ProfileModal';

const Chat = ({ userId, onLogout }) => {
    const { socket, isConnected, connectSocket } = useContext(SocketContext);
    const { callUser, callUserAudio } = useContext(CallContext);

    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [allUsers, setAllUsers] = useState({});
    const [typingUsers, setTypingUsers] = useState({});
    const typingTimeoutRef = useRef(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Initial Socket Connection
    useEffect(() => {
        if (!socket && userId) {
            connectSocket(userId);
        }
    }, [userId, socket, connectSocket]);

    // Handle Window Resize for Responsiveness
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch all users on mount to map IDs to Names
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
            const data = await res.json();
            const userMap = {};
            data.forEach(u => {
                userMap[u._id] = u;
            });
            setAllUsers(userMap);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('users-online', (userIds) => {
            setOnlineUsers(userIds.filter(id => id !== userId));
        });

        socket.on('receive-message', ({ from, message, timestamp }) => {
            if (activeChat === from) {
                setMessages(prev => [...prev, { from, message, timestamp, isMe: false }]);
            }
            setTypingUsers(prev => ({ ...prev, [from]: false }));
        });

        socket.on('typing', ({ from }) => {
            setTypingUsers(prev => ({ ...prev, [from]: true }));
        });

        socket.on('stop-typing', ({ from }) => {
            setTypingUsers(prev => ({ ...prev, [from]: false }));
        });

        return () => {
            socket.off('users-online');
            socket.off('receive-message');
            socket.off('typing');
            socket.off('stop-typing');
        };
    }, [socket, userId, activeChat]);

    // Fetch History when Active Chat changes
    useEffect(() => {
        if (!activeChat) return;

        const fetchHistory = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/history/${activeChat}?from=${userId}`);
                const data = await res.json();
                setMessages(data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };

        setMessages([]);
        fetchHistory();
    }, [activeChat, userId]);

    const handleSendMessage = (text) => {
        if (!activeChat) return;
        if (!socket) {
            console.error("Socket not connected");
            return;
        }

        const msgData = { from: userId, to: activeChat, message: text };
        socket.emit('send-message', msgData);
        socket.emit('stop-typing', { from: userId, to: activeChat });

        setMessages(prev => [...prev, { from: userId, message: text, timestamp: new Date(), isMe: true }]);
    };

    const handleTyping = (isTyping) => {
        if (!activeChat) return;
        if (!socket) return; // Safety check

        if (isTyping) {
            socket.emit('typing', { from: userId, to: activeChat });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop-typing', { from: userId, to: activeChat });
            }, 3000);

        } else {
            socket.emit('stop-typing', { from: userId, to: activeChat });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    };

    const isTyping = activeChat ? typingUsers[activeChat] : false;

    const displayUsers = Object.values(allUsers)
        .filter(u => u._id !== userId)
        .map(u => ({
            id: u._id,
            name: u.name,
            isOnline: onlineUsers.includes(u._id)
        }));

    // Rendering Logic for Mobile
    const showChatList = !isMobile || (isMobile && !activeChat);
    const showChatWindow = !isMobile || (isMobile && activeChat);

    return (
        <div className="app-container">
            {/* NavRail: Hide on mobile when chat is active? Or show bottom bar? For now, keep it on left or hide */}
            <div className={`nav-rail-wrapper ${isMobile ? 'mobile-hidden' : ''}`}>
                <NavRail onLogout={onLogout} onProfileClick={() => setShowProfileModal(true)} />
            </div>

            {showChatList && (
                <div className="chat-list-wrapper" style={{ width: isMobile ? '100%' : '320px', flexShrink: 0 }}>
                    <ChatList
                        users={displayUsers}
                        onSelectUser={(id) => setActiveChat(id)}
                        activeUser={activeChat}
                        isConnected={isConnected}
                        myId={userId}
                    />
                </div>
            )}

            {showChatWindow && (
                <div className="chat-window-wrapper" style={{ flex: 1 }}>
                    {/* Back Button for Mobile */}
                    {isMobile && (
                        <button onClick={() => setActiveChat(null)} style={{ margin: '10px', padding: '5px 10px', background: '#e2e8f0', border: 'none', borderRadius: '5px' }}>
                            ← Back
                        </button>
                    )}
                    <ChatWindow
                        currentChat={allUsers[activeChat]?.name || "Select User"}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        onVideoCall={() => callUser(activeChat)}
                        onAudioCall={() => callUserAudio(activeChat)}
                        isTyping={isTyping}
                        onTyping={handleTyping}
                    />
                </div>
            )}

            <VideoCallModal />
            <ProfileModal
                userId={userId}
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                onUpdate={(updatedUser) => {
                    // Refresh users or update local state
                    fetchUsers();
                }}
            />
        </div>
    );
};

export default Chat;
