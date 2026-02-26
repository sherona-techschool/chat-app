import React, { useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import { BsCameraVideo, BsTelephone, BsSearch, BsThreeDotsVertical, BsEmojiSmile, BsMic, BsPaperclip, BsCheck, BsCheckAll } from 'react-icons/bs';

const ChatWindow = ({ messages, currentChat, onSendMessage, onVideoCall, onAudioCall, isTyping, onTyping }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    if (!currentChat) {
        return (
            <div style={styles.emptyContainer}>
                <div style={styles.emptyContent}>
                    <div style={{ fontSize: 60, marginBottom: 20 }}>👋</div>
                    <h3>Select a chat to start messaging</h3>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.userInfo}>
                    <div style={styles.avatar}>{currentChat.charAt(0).toUpperCase()}</div>
                    <div>
                        <h3>{currentChat}</h3>
                        <span style={styles.status}>Online</span>
                    </div>
                </div>
                <div style={styles.actions}>
                    <button onClick={onVideoCall} style={styles.iconBtn} title="Video Call">
                        <BsCameraVideo size={20} />
                    </button>
                    <button onClick={onAudioCall} style={styles.iconBtn} title="Voice Call">
                        <BsTelephone size={18} />
                    </button>
                    <div style={styles.divider}></div>
                    <button style={styles.iconBtn}><BsSearch size={18} /></button>
                    <button style={styles.iconBtn}><BsThreeDotsVertical size={18} /></button>
                </div>
            </div>

            {/* Messages */}
            <div style={styles.messagesList}>
                <div style={styles.dateSeparator}><span>Today</span></div>

                {messages.map((msg, index) => (
                    <div key={index} style={{
                        ...styles.messageRow,
                        justifyContent: msg.isMe ? 'flex-end' : 'flex-start',
                    }}>
                        {!msg.isMe && (
                            <div style={styles.smallAvatar}>{msg.from && msg.from.charAt(0).toUpperCase()}</div>
                        )}
                        <div style={{
                            ...styles.messageBubble,
                            backgroundColor: msg.isMe ? 'var(--sender-bubble)' : 'var(--receiver-bubble)',
                            color: msg.isMe ? 'var(--sender-text)' : 'var(--receiver-text)',
                            borderRadius: msg.isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                        }}>
                            {msg.message}
                            <div style={styles.metaRow}>
                                <span style={{
                                    ...styles.timestamp,
                                    color: msg.isMe ? 'rgba(255,255,255,0.7)' : '#9ca3af'
                                }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.isMe && (
                                    <span style={styles.ticks}>
                                        <BsCheckAll size={16} color="rgba(255,255,255,0.9)" />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                        <div style={styles.smallAvatar}>{currentChat.charAt(0).toUpperCase()}</div>
                        <div style={styles.typingBubble}>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={styles.inputArea}>
                <button style={styles.inputActionBtn}><BsEmojiSmile size={20} /></button>
                <button style={styles.inputActionBtn}><BsPaperclip size={20} /></button>
                <MessageInput onSendMessage={onSendMessage} onTyping={onTyping} />
                <button style={styles.micBtn} onClick={() => console.log('Voice feature not implemented yet')}><BsMic size={20} /></button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--chat-bg)',
    },
    emptyContainer: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--chat-bg)',
        color: '#6e7a8a',
    },
    emptyContent: {
        textAlign: 'center',
    },
    header: {
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--divider-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '72px',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#e0e7ff',
        color: '#0066ff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: '600',
    },
    status: {
        fontSize: '12px',
        color: '#10b981',
        fontWeight: '500',
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    divider: {
        width: '1px',
        height: '24px',
        backgroundColor: '#e2e8f0',
        margin: '0 8px',
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        color: '#64748b',
        borderRadius: '8px',
        transition: 'background 0.2s',
        display: 'flex',
        alignItems: 'center',
    },
    messagesList: {
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '20px 20px',
    },
    dateSeparator: {
        textAlign: 'center',
        margin: '20px 0',
        position: 'relative',
    },
    messageRow: {
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
        maxWidth: '100%',
    },
    smallAvatar: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: '#cbd5e1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '12px',
        color: '#fff',
        marginBottom: '4px',
    },
    messageBubble: {
        maxWidth: '60%',
        padding: '8px 12px', // Compact
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        position: 'relative',
        lineHeight: '1.4',
        fontSize: '15px',
        display: 'flex',
        flexDirection: 'column',
    },
    metaRow: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '4px',
        marginTop: '2px',
    },
    timestamp: {
        fontSize: '10px',
    },
    ticks: {
        display: 'flex',
        alignItems: 'center',
    },
    typingBubble: {
        backgroundColor: '#ffffff',
        padding: '12px 16px',
        borderRadius: '12px 12px 12px 0',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        height: '40px',
    },
    inputArea: {
        padding: '16px 24px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--divider-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    inputActionBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#64748b',
        padding: '8px',
    },
    micBtn: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#0066ff',
        color: '#fff',
        border: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,102,255,0.2)',
    }
};

export default ChatWindow;
