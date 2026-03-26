
//unread message

import React, { useState, useEffect, useContext, useRef } from 'react';
import { SocketContext } from '../context/SocketContext.jsx';
import { CallContext } from '../context/CallContext.jsx';
import ChatList from '../components/ChatList.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import VideoCallModal from '../components/VideoCallModal.jsx';
import AudioCallModal from '../components/AudiocallsModal.jsx';
import NavRail from '../components/NavRail.jsx';
import ProfileModal from '../components/ProfileModal.jsx';

const Chat = ({ userId, onLogout }) => {
    const { socket, isConnected, connectSocket } = useContext(SocketContext);
    const { callUser, audioCallUser } = useContext(CallContext);

    const [activeChat,       setActiveChat]      = useState(null);
    const [messages,         setMessages]         = useState([]);
    const [onlineUsers,      setOnlineUsers]      = useState([]);
    const [allUsers,         setAllUsers]         = useState({});
    const [typingUsers,      setTypingUsers]      = useState({});
    const [unreadCounts,     setUnreadCounts]     = useState({}); // ✅ { [senderId]: number }
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isMobile,         setIsMobile]         = useState(window.innerWidth < 768);
    const typingTimeoutRef = useRef(null);

    // ✅ Keep a ref to activeChat so socket handlers always see the latest value
    // without needing activeChat in the dependency array (which would re-register listeners)
    const activeChatRef = useRef(null);
    useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

    useEffect(() => {
        if (!socket && userId) connectSocket(userId);
    }, [userId, socket, connectSocket]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
            const data = await res.json();
            const map  = {};
            data.forEach(u => { map[u._id] = u; });
            setAllUsers(map);
        } catch (err) { console.error("Failed to fetch users", err); }
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('users-online', ids => setOnlineUsers(ids.filter(id => id !== userId)));

        socket.on('receive-message', ({ from, message, timestamp }) => {
            if (activeChatRef.current === from) {
                // ✅ Chat is open — add to messages normally, no badge needed
                setMessages(prev => [...prev, { from, message, timestamp, isMe: false }]);
            } else {
                // ✅ Chat is NOT open — increment unread count for this sender
                setUnreadCounts(prev => ({
                    ...prev,
                    [from]: (prev[from] || 0) + 1,
                }));
            }
            setTypingUsers(prev => ({ ...prev, [from]: false }));
        });

        socket.on('typing',      ({ from }) => setTypingUsers(prev => ({ ...prev, [from]: true  })));
        socket.on('stop-typing', ({ from }) => setTypingUsers(prev => ({ ...prev, [from]: false })));

        return () => {
            socket.off('users-online');
            socket.off('receive-message');
            socket.off('typing');
            socket.off('stop-typing');
        };
    }, [socket, userId]); // ✅ no activeChat here — use activeChatRef instead

    useEffect(() => {
        if (!activeChat) return;
        setMessages([]);
        const fetchHistory = async () => {
            try {
                const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/history/${activeChat}?from=${userId}`);
                const data = await res.json();
                setMessages(data);
            } catch (err) { console.error("Failed to fetch history", err); }
        };
        fetchHistory();
    }, [activeChat, userId]);

    // ✅ When user clicks a chat — open it AND clear its unread count
    const handleSelectUser = (id) => {
        setActiveChat(id);
        setUnreadCounts(prev => ({ ...prev, [id]: 0 }));
    };

    const handleSendMessage = (text) => {
        if (!activeChat || !socket) return;
        socket.emit('send-message', { from: userId, to: activeChat, message: text });
        socket.emit('stop-typing',  { from: userId, to: activeChat });
        setMessages(prev => [...prev, { from: userId, message: text, timestamp: new Date(), isMe: true }]);
    };

    const handleTyping = (isTypingNow) => {
        if (!activeChat || !socket) return;
        if (isTypingNow) {
            socket.emit('typing', { from: userId, to: activeChat });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() =>
                socket.emit('stop-typing', { from: userId, to: activeChat }), 3000);
        } else {
            socket.emit('stop-typing', { from: userId, to: activeChat });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    };

    const activeChatUser = allUsers[activeChat] || null;
    const isTyping       = activeChat ? typingUsers[activeChat] : false;
    const displayUsers   = Object.values(allUsers)
        .filter(u => u._id !== userId)
        .map(u => ({ id: u._id, name: u.name, isOnline: onlineUsers.includes(u._id) }));

    const showChatList   = !isMobile || (isMobile && !activeChat);
    const showChatWindow = !isMobile || (isMobile && !!activeChat);

    return (
        <div className="app-container">

            <div className={`nav-rail-wrapper ${isMobile ? 'mobile-hidden' : ''}`}>
                <NavRail onLogout={onLogout} onProfileClick={() => setShowProfileModal(true)} />
            </div>

            {showChatList && (
                <div className="chat-list-wrapper" style={{ width: isMobile ? '100%' : '320px', flexShrink: 0 }}>
                    <ChatList
                        users={displayUsers}
                        onSelectUser={handleSelectUser}  // ✅ clears unread when chat opened
                        activeUser={activeChat}
                        isConnected={isConnected}
                        myId={userId}
                        unreadCounts={unreadCounts}      // ✅ passed down for badges
                    />
                </div>
            )}

            {showChatWindow && (
                <div className="chat-window-wrapper" style={{ flex: 1 }}>
                    {isMobile && (
                        <button
                            onClick={() => setActiveChat(null)}
                            style={{ margin:'10px', padding:'5px 10px', background:'#e2e8f0', border:'none', borderRadius:'5px' }}
                        >
                            ← Back
                        </button>
                    )}
                    <ChatWindow
                        currentChat={activeChatUser?.name || ""}
                        currentChatUser={activeChatUser}
                        messages={messages}
                        onSendMessage={handleSendMessage}
                        isTyping={isTyping}
                        onTyping={handleTyping}
                    />
                </div>
            )}

            <VideoCallModal />
            <AudioCallModal />

            <ProfileModal
                userId={userId}
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                onUpdate={() => fetchUsers()}
            />
        </div>
    );
};

export default Chat;