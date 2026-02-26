import React, { useState, useEffect } from 'react';
import { BiEdit, BiPhoneCall, BiVideo } from 'react-icons/bi';
import { FiSearch, FiPhoneIncoming, FiPhoneOutgoing } from 'react-icons/fi';
import axios from 'axios';

const ChatList = ({ users, onSelectUser, activeUser, isConnected, myId }) => {
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [callLogs, setCallLogs] = useState([]);
    const [loadingCalls, setLoadingCalls] = useState(false);

    useEffect(() => {
        if (activeTab === 'Calls') {
            fetchCallLogs();
        }
    }, [activeTab]);

    const fetchCallLogs = async () => {
        try {
            setLoadingCalls(true);
      
            const storedUser = JSON.parse(localStorage.getItem('chat-user'));
            const currentUserId = myId || (storedUser ? storedUser._id : null);

            if (!currentUserId) return;

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/calls?userId=${currentUserId}`);
            setCallLogs(res.data);
        } catch (error) {
            console.error("Error fetching call logs", error);
        } finally {
            setLoadingCalls(false);
        }
    };

    const usersList = users.filter(u => u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return 'Today';
        return date.toLocaleDateString();
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.titleRow}>
                    <h2>Chats</h2>
                    <button style={styles.iconBtn}><BiEdit size={20} /></button>
                </div>
                <div style={styles.connectionStatus}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#10b981' : '#ef4444', display: 'inline-block', marginRight: 5 }}></span>
                    <span style={{ fontSize: 12, color: '#6e7a8a' }}>{isConnected ? 'Online' : 'Disconnected'}</span>
                </div>

                {/* Search */}
                <div style={styles.searchWrapper}>
                    <FiSearch size={16} color="#8e8e8e" style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tabs */}
                <div style={styles.tabs}>
                    {['All', 'Unread', 'Groups', 'Calls'].map(tab => (
                        <div
                            key={tab}
                            style={activeTab === tab ? styles.tabActive : styles.tab}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </div>
                    ))}
                </div>
            </div>

            {/* List */}
            <div style={styles.list}>
                {activeTab === 'Calls' ? (
                    <>
                        {loadingCalls && <div style={{ padding: 20, textAlign: 'center', color: '#8e8e8e' }}>Loading calls...</div>}
                        {!loadingCalls && callLogs.length === 0 && (
                            <div style={{ padding: 20, textAlign: 'center', color: '#8e8e8e' }}>No recent calls</div>
                        )}
                        {callLogs.map(log => (
                            <div key={log.id} style={styles.userItem}>
                                <div style={styles.avatarWrapper}>
                                    <div style={styles.avatar}>{log.otherUser.name.charAt(0).toUpperCase()}</div>
                                </div>
                                <div style={styles.userInfo}>
                                    <div style={styles.userTop}>
                                        <h4 style={{ fontSize: '15px' }}>{log.otherUser.name}</h4>
                                        <span style={styles.time}>{formatDate(log.date)}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#64748b' }}>
                                        {log.direction === 'outgoing' ? <FiPhoneOutgoing size={12} /> : <FiPhoneIncoming size={12} color={log.direction === 'incoming' ? 'red' : 'inherit'} />}
                                        <span>
                                            {log.type === 'video_call' ? 'Video Call' : 'Audio Call'}
                                        </span>
                                        <span style={{ marginLeft: 'auto' }}>
                                            {log.type === 'video_call' ? <BiVideo size={16} /> : <BiPhoneCall size={16} />}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{formatTime(log.date)}</div>
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        {usersList.length === 0 && (
                            <div style={{ padding: 20, textAlign: 'center', color: '#8e8e8e' }}>
                                {searchTerm ? 'No users found' : 'No active users'}
                            </div>
                        )}

                        {usersList.map((user, idx) => (
                            <div
                                key={user.id}
                                onClick={() => {
                                    onSelectUser(user.id);
                                }}
                                style={{
                                    ...styles.userItem,
                                    backgroundColor: activeUser === user.id ? 'var(--active-chat-bg)' : 'transparent',
                                    borderLeft: activeUser === user.id ? '3px solid var(--primary-color)' : '3px solid transparent',
                                }}
                            >
                                <div style={styles.avatarWrapper}>
                                    <div style={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
                                    <div style={{
                                        ...styles.onlineDot,
                                        backgroundColor: user.isOnline ? '#10b981' : '#ccc'
                                    }}></div>
                                </div>

                                <div style={styles.userInfo}>
                                    <div style={styles.userTop}>
                                        <h4>{user.name}</h4>
                                        <span style={styles.time}>Today</span>
                                    </div>
                                    <p style={styles.lastMsg}>
                                        Click to start chatting...
                                    </p>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        width: '100%',
        height: '100%',
        borderRight: '1px solid var(--divider-color)',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        padding: '20px',
        paddingBottom: '0',
    },
    titleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '5px',
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#0066ff',
        padding: 0,
    },
    connectionStatus: {
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
    },
    searchWrapper: {
        position: 'relative',
        marginBottom: '15px',
    },
    searchIcon: {
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
    },
    searchInput: {
        width: '100%',
        padding: '10px 10px 10px 36px',
        backgroundColor: '#f0f2f5',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        outline: 'none',
    },
    tabs: {
        display: 'flex',
        gap: '20px',
        borderBottom: '1px solid #eaeef2',
    },
    tab: {
        paddingBottom: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#6e7a8a',
        borderBottom: '2px solid transparent',
    },
    tabActive: {
        paddingBottom: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#0066ff',
        fontWeight: '600',
        borderBottom: '2px solid #0066ff',
    },
    list: {
        flex: 1,
        overflowY: 'auto',
        paddingTop: '10px',
    },
    userItem: {
        display: 'flex',
        padding: '12px 20px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        borderBottom: '1px solid #f0f2f5'
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: '12px',
    },
    avatar: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '18px',
        fontWeight: '600',
        color: '#475569',
    },
    onlineDot: {
        position: 'absolute',
        bottom: '2px',
        right: '2px',
        width: '10px',
        height: '10px',
        backgroundColor: '#10b981',
        borderRadius: '50%',
        border: '2px solid #fff',
    },
    userInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    userTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
    },
    time: {
        fontSize: '11px',
        color: '#94a3b8',
    },
    lastMsg: {
        fontSize: '13px',
        color: '#64748b',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '180px',
    }
};

export default ChatList;
