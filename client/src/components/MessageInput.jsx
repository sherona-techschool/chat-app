import React, { useState } from 'react';

const MessageInput = ({ onSendMessage, onTyping }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('MessageInput: handleSubmit triggered', message);
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
            if (onTyping) onTyping(false);
        }
    };

    const handleChange = (e) => {
        setMessage(e.target.value);
        if (onTyping) {
            onTyping(true);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={styles.form}>
            <input
                type="text"
                value={message}
                onChange={handleChange}
                onBlur={() => onTyping && onTyping(false)}
                placeholder="Type a message..."
                style={styles.input}
            />
        </form>
    );
};

const styles = {
    form: {
        flex: 1,
        display: 'flex',
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        fontSize: '15px',
        outline: 'none',
        transition: 'all 0.2s',
    },
};

export default MessageInput;
