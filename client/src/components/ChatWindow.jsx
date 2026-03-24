
import React, { useEffect, useRef, useContext } from 'react';
import MessageInput from './MessageInput';
import { CallContext } from '../context/CallContext';
import {
    BsCameraVideo, BsTelephone, BsSearch,
    BsThreeDotsVertical, BsEmojiSmile, BsMic,
    BsPaperclip, BsCheckAll,
} from 'react-icons/bs';

// Props:

const ChatWindow = ({
    messages,
    currentChat,
    currentChatUser,
    onSendMessage,
    isTyping,
    onTyping,
}) => {
    const messagesEndRef = useRef(null);
    // ✅ Pull call functions from context — not from props
    const { callUser, audioCallUser } = useContext(CallContext);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // 📹 Video call button handler
    const handleVideoCall = () => {
        if (!currentChatUser?._id) {
            console.error("[ChatWindow] ❌ currentChatUser._id missing — is currentChatUser prop set?");
            return;
        }
        console.log("[ChatWindow] 📹 callUser →", currentChatUser._id);
        callUser(currentChatUser._id, currentChatUser.name || currentChat);
    };

    // 📞 Audio call button handler
    const handleAudioCall = () => {
        if (!currentChatUser?._id) {
            console.error("[ChatWindow] ❌ currentChatUser._id missing — is currentChatUser prop set?");
            return;
        }
        console.log("[ChatWindow] 📞 audioCallUser →", currentChatUser._id);
        audioCallUser(currentChatUser._id, currentChatUser.name || currentChat);
    };

    if (!currentChat) {
        return (
            <div style={S.emptyContainer}>
                <div style={S.emptyContent}>
                    <div style={{ fontSize: 60, marginBottom: 20 }}>👋</div>
                    <h3>Select a chat to start messaging</h3>
                </div>
            </div>
        );
    }

    return (
        <div style={S.container}>

            {/* Header */}
            <div style={S.header}>
                <div style={S.userInfo}>
                    <div style={S.avatar}>{currentChat.charAt(0).toUpperCase()}</div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 16 }}>{currentChat}</h3>
                        <span style={S.status}>Online</span>
                    </div>
                </div>
                <div style={S.actions}>
                    {/* 📹 Video call */}
                    <button onClick={handleVideoCall} style={S.iconBtn} title="Video Call">
                        <BsCameraVideo size={20} />
                    </button>
                    {/* 📞 Audio call */}
                    <button onClick={handleAudioCall} style={S.iconBtn} title="Voice Call">
                        <BsTelephone size={18} />
                    </button>
                    <div style={S.divider} />
                    <button style={S.iconBtn}><BsSearch size={18} /></button>
                    <button style={S.iconBtn}><BsThreeDotsVertical size={18} /></button>
                </div>
            </div>

            {/* Messages */}
            <div style={S.messagesList}>
                <div style={S.dateSeparator}><span>Today</span></div>

                {messages.map((msg, index) => (
                    <div key={index} style={{
                        ...S.messageRow,
                        justifyContent: msg.isMe ? 'flex-end' : 'flex-start',
                    }}>
                        {!msg.isMe && (
                            <div style={S.smallAvatar}>
                                {msg.from && msg.from.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div style={{
                            ...S.messageBubble,
                            backgroundColor: msg.isMe ? 'var(--sender-bubble)' : 'var(--receiver-bubble)',
                            color:           msg.isMe ? 'var(--sender-text)'   : 'var(--receiver-text)',
                            borderRadius:    msg.isMe ? '12px 12px 0 12px'     : '12px 12px 12px 0',
                        }}>
                            {msg.message}
                            <div style={S.metaRow}>
                                <span style={{
                                    ...S.timestamp,
                                    color: msg.isMe ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                                }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                </span>
                                {msg.isMe && (
                                    <span style={S.ticks}>
                                        <BsCheckAll size={16} color="rgba(255,255,255,0.9)" />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div style={{ ...S.messageRow, justifyContent: 'flex-start' }}>
                        <div style={S.smallAvatar}>{currentChat.charAt(0).toUpperCase()}</div>
                        <div style={S.typingBubble}>
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                            <div className="typing-dot" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={S.inputArea}>
                <button style={S.inputActionBtn}><BsEmojiSmile size={20} /></button>
                <button style={S.inputActionBtn}><BsPaperclip size={20} /></button>
                <MessageInput onSendMessage={onSendMessage} onTyping={onTyping} />
                <button style={S.micBtn}><BsMic size={20} /></button>
            </div>
        </div>
    );
};

const S = {
    container:      { flex:1, display:'flex', flexDirection:'column', height:'100%', backgroundColor:'var(--chat-bg)' },
    emptyContainer: { flex:1, display:'flex', justifyContent:'center', alignItems:'center', backgroundColor:'var(--chat-bg)', color:'#6e7a8a' },
    emptyContent:   { textAlign:'center' },
    header:         { padding:'16px 24px', backgroundColor:'#ffffff', borderBottom:'1px solid var(--divider-color)', display:'flex', justifyContent:'space-between', alignItems:'center', height:'72px' },
    userInfo:       { display:'flex', alignItems:'center', gap:'12px' },
    avatar:         { width:'40px', height:'40px', borderRadius:'50%', backgroundColor:'#e0e7ff', color:'#0066ff', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:'600' },
    status:         { fontSize:'12px', color:'#10b981', fontWeight:'500' },
    actions:        { display:'flex', alignItems:'center', gap:'8px' },
    divider:        { width:'1px', height:'24px', backgroundColor:'#e2e8f0', margin:'0 8px' },
    iconBtn:        { background:'none', border:'none', cursor:'pointer', padding:'8px', color:'#64748b', borderRadius:'8px', transition:'background 0.2s', display:'flex', alignItems:'center' },
    messagesList:   { flex:1, padding:'24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'16px', backgroundImage:'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize:'20px 20px' },
    dateSeparator:  { textAlign:'center', margin:'20px 0' },
    messageRow:     { display:'flex', gap:'8px', alignItems:'flex-end', maxWidth:'100%' },
    smallAvatar:    { width:'28px', height:'28px', borderRadius:'50%', backgroundColor:'#cbd5e1', display:'flex', justifyContent:'center', alignItems:'center', fontSize:'12px', color:'#fff', marginBottom:'4px' },
    messageBubble:  { maxWidth:'60%', padding:'8px 12px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', lineHeight:'1.4', fontSize:'15px', display:'flex', flexDirection:'column' },
    metaRow:        { display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'4px', marginTop:'2px' },
    timestamp:      { fontSize:'10px' },
    ticks:          { display:'flex', alignItems:'center' },
    typingBubble:   { backgroundColor:'#ffffff', padding:'12px 16px', borderRadius:'12px 12px 12px 0', display:'flex', gap:'4px', alignItems:'center', height:'40px' },
    inputArea:      { padding:'16px 24px', backgroundColor:'#ffffff', borderTop:'1px solid var(--divider-color)', display:'flex', alignItems:'center', gap:'12px' },
    inputActionBtn: { background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:'8px' },
    micBtn:         { width:'40px', height:'40px', borderRadius:'50%', backgroundColor:'#0066ff', color:'#fff', border:'none', display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,102,255,0.2)' },
};

export default ChatWindow;