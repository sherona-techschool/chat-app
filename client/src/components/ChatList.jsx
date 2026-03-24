
//unread message

import React, { useState, useEffect } from 'react';
import { BiEdit, BiPhoneCall, BiVideo } from 'react-icons/bi';
import { FiSearch, FiPhoneIncoming, FiPhoneOutgoing } from 'react-icons/fi';
import axios from 'axios';

// unreadCounts = { [userId]: number } — passed from Chat.jsx
const ChatList = ({ users, onSelectUser, activeUser, isConnected, myId, unreadCounts = {} }) => {
    const [activeTab,    setActiveTab]    = useState('All');
    const [searchTerm,   setSearchTerm]   = useState('');
    const [callLogs,     setCallLogs]     = useState([]);
    const [loadingCalls, setLoadingCalls] = useState(false);

    useEffect(() => {
        if (activeTab === 'Calls') fetchCallLogs();
    }, [activeTab]);

    const fetchCallLogs = async () => {
        try {
            setLoadingCalls(true);
            const storedUser    = JSON.parse(localStorage.getItem('chat-user'));
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

    // Total unread across all users — shown as badge on "Unread" tab
    const totalUnread = users.reduce((sum, u) => sum + (unreadCounts[u.id] || 0), 0);

    // Filter by search
    const searched = users.filter(u =>
        u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // "Unread" tab only shows users who have unread messages
    const usersList = activeTab === 'Unread'
        ? searched.filter(u => (unreadCounts[u.id] || 0) > 0)
        : searched;

    const formatTime = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = d => {
        const date = new Date(d);
        return date.toDateString() === new Date().toDateString() ? 'Today' : date.toLocaleDateString();
    };

    return (
        <div style={styles.container}>

            {/* Header */}
            <div style={styles.header}>
                <div style={styles.titleRow}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Chats</h2>
                    <button style={styles.iconBtn}><BiEdit size={20} /></button>
                </div>

                <div style={styles.connectionStatus}>
                    <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: isConnected ? '#10b981' : '#ef4444',
                        display: 'inline-block', marginRight: 5,
                    }} />
                    <span style={{ fontSize: 12, color: '#6e7a8a' }}>
                        {isConnected ? 'Online' : 'Disconnected'}
                    </span>
                </div>

                {/* Search */}
                <div style={styles.searchWrapper}>
                    <FiSearch size={16} color="#8e8e8e" style={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
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
                            <span>{tab}</span>

                            {/* ✅ Badge on "Unread" tab showing total unread count */}
                            {tab === 'Unread' && totalUnread > 0 && (
                                <span style={styles.tabBadge}>
                                    {totalUnread > 99 ? '99+' : totalUnread}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* List */}
            <div style={styles.list}>

             
                {activeTab === 'Calls' ? (
                    <>
                        {loadingCalls && (
                            <div style={styles.emptyMsg}>Loading calls...</div>
                        )}
                        {!loadingCalls && callLogs.length === 0 && (
                            <div style={styles.emptyMsg}>No recent calls</div>
                        )}
                        {callLogs.map(log => (
                            <div key={log.id} style={styles.userItem}>
                                <div style={styles.avatarWrapper}>
                                    <div style={styles.avatar}>
                                        {log.otherUser.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div style={styles.userInfo}>
                                    <div style={styles.userTop}>
                                        <h4 style={{ fontSize: 15, margin: 0 }}>{log.otherUser.name}</h4>
                                        <span style={styles.time}>{formatDate(log.date)}</span>
                                    </div>
                                    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, color:'#64748b' }}>
                                        {log.direction === 'outgoing'
                                            ? <FiPhoneOutgoing size={12} />
                                            : <FiPhoneIncoming size={12} color="red" />}
                                        <span>{log.type === 'video_call' ? 'Video Call' : 'Audio Call'}</span>
                                        <span style={{ marginLeft:'auto' }}>
                                            {log.type === 'video_call' ? <BiVideo size={16} /> : <BiPhoneCall size={16} />}
                                        </span>
                                    </div>
                                    <div style={{ fontSize:11, color:'#94a3b8' }}>{formatTime(log.date)}</div>
                                </div>
                            </div>
                        ))}
                    </>

                ) : (
                    /* ── ALL / UNREAD / GROUPS TABS ───────────────────── */
                    <>
                        {usersList.length === 0 && (
                            <div style={styles.emptyMsg}>
                                {activeTab === 'Unread'
                                    ? '🎉 No unread messages'
                                    : searchTerm ? 'No users found' : 'No active users'}
                            </div>
                        )}

                        {usersList.map(user => {
                            const unread   = unreadCounts[user.id] || 0;
                            const isActive = activeUser === user.id;
                            const hasUnread = unread > 0;

                            return (
                                <div
                                    key={user.id}
                                    onClick={() => onSelectUser(user.id)}
                                    style={{
                                        ...styles.userItem,
                                        backgroundColor: isActive ? 'var(--active-chat-bg)' : 'transparent',
                                        borderLeft: isActive
                                            ? '3px solid var(--primary-color)'
                                            : '3px solid transparent',
                                    }}
                                >
                                    {/* Avatar + online dot */}
                                    <div style={styles.avatarWrapper}>
                                        <div style={styles.avatar}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{
                                            ...styles.onlineDot,
                                            backgroundColor: user.isOnline ? '#10b981' : '#ccc',
                                        }} />
                                    </div>

                                    {/* Name + time row */}
                                    <div style={styles.userInfo}>
                                        <div style={styles.userTop}>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: 15,
                                                // ✅ Bold name when there are unread messages
                                                fontWeight: hasUnread ? 700 : 500,
                                                color: '#1e293b',
                                            }}>
                                                {user.name}
                                            </h4>
                                            <span style={{
                                                ...styles.time,
                                                // ✅ Blue time when there are unread messages
                                                color: hasUnread ? '#0066ff' : '#94a3b8',
                                                fontWeight: hasUnread ? 600 : 400,
                                            }}>
                                                Today
                                            </span>
                                        </div>

                                        {/* Last message + unread badge row */}
                                        <div style={styles.bottomRow}>
                                            <p style={{
                                                ...styles.lastMsg,
                                                // ✅ Bold preview text when unread
                                                fontWeight: hasUnread ? 600 : 400,
                                                color: hasUnread ? '#1e293b' : '#64748b',
                                            }}>
                                                Click to start chatting...
                                            </p>

                                            {/* ✅ Unread count badge — only visible when count > 0 */}
                                            {hasUnread && (
                                                <span style={styles.unreadBadge}>
                                                    {unread > 99 ? '99+' : unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
        paddingBottom: 0,
    },
    titleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#0066ff',
        padding: 0,
    },
    connectionStatus: {
        marginBottom: 15,
        display: 'flex',
        alignItems: 'center',
    },
    searchWrapper: {
        position: 'relative',
        marginBottom: 15,
    },
    searchIcon: {
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
    },
    searchInput: {
        width: '100%',
        padding: '10px 10px 10px 36px',
        backgroundColor: '#f0f2f5',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box',
    },

    // Tabs
    tabs: {
        display: 'flex',
        gap: 20,
        borderBottom: '1px solid #eaeef2',
    },
    tab: {
        paddingBottom: 10,
        cursor: 'pointer',
        fontSize: 14,
        color: '#6e7a8a',
        borderBottom: '2px solid transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
    },
    tabActive: {
        paddingBottom: 10,
        cursor: 'pointer',
        fontSize: 14,
        color: '#0066ff',
        fontWeight: 600,
        borderBottom: '2px solid #0066ff',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
    },
    // ✅ Small badge on the Unread tab itself
    tabBadge: {
        background: '#0066ff',
        color: '#fff',
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 700,
        padding: '1px 5px',
        lineHeight: '15px',
    },

    // List
    list: {
        flex: 1,
        overflowY: 'auto',
        paddingTop: 10,
    },
    emptyMsg: {
        padding: 20,
        textAlign: 'center',
        color: '#8e8e8e',
        fontSize: 14,
    },
    userItem: {
        display: 'flex',
        padding: '12px 20px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        borderBottom: '1px solid #f0f2f5',
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 12,
        flexShrink: 0,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 18,
        fontWeight: 600,
        color: '#475569',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 10,
        height: 10,
        borderRadius: '50%',
        border: '2px solid #fff',
    },
    userInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minWidth: 0,   // allows text overflow to work
    },
    userTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    time: {
        fontSize: 11,
        flexShrink: 0,
    },
    bottomRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    lastMsg: {
        fontSize: 13,
        margin: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flex: 1,
    },
    // ✅ The blue circular badge showing unread count
    unreadBadge: {
        minWidth: 20,
        height: 20,
        background: '#0066ff',
        color: '#fff',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 5px',
        flexShrink: 0,
    },
};

export default ChatList;