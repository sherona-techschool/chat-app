const Message = require('../models/Message');
const User = require('../models/User');

exports.getHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.query.from;

        if (!userId || !myId) {
            return res.status(400).json({ message: 'Missing user IDs' });
        }

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: userId },
                { sender: userId, receiver: myId }
            ]
        }).sort({ createdAt: 1 });

        const formattedMessages = messages.map(msg => ({
            senderId: msg.sender,
            message: msg.content,
            type: msg.type || 'text',
            fileUrl: msg.fileUrl || '',
            timestamp: msg.createdAt,
            isMe: msg.sender && msg.sender.toString() === myId,
            from: msg.sender
        }));

        res.status(200).json(formattedMessages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'fullName username email _id avatar status');

        const mappedUsers = users.map(u => ({
            _id: u._id,
            name: u.fullName,
            username: u.username,
            email: u.email,
            avatar: u.avatar,
            status: u.status
        }));

        res.status(200).json(mappedUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

exports.getCallLogs = async (req, res) => {
    try {
        const userId = req.query.userId; // Or from req.user if auth middleware is used

        if (!userId) {
            return res.status(400).json({ message: 'Missing user ID' });
        }

        const calls = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }],
            type: { $in: ['video_call', 'audio_call'] }
        })
            .sort({ createdAt: -1 })
            .populate('sender', 'fullName username avatar')
            .populate('receiver', 'fullName username avatar');

        const formattedCalls = calls.map(call => {
            const isCaller = call.sender._id.toString() === userId;
            const otherUser = isCaller ? call.receiver : call.sender;

            return {
                id: call._id,
                type: call.type, // 'video_call' or 'audio_call'
                direction: isCaller ? 'outgoing' : 'incoming',
                date: call.createdAt,
                otherUser: {
                    id: otherUser._id,
                    name: otherUser.fullName,
                    avatar: otherUser.avatar
                }
            };
        });

        res.status(200).json(formattedCalls);
    } catch (error) {
        console.error('Error fetching call logs:', error);
        res.status(500).json({ message: 'Error fetching call logs' });
    }
};

exports.getChats = async (req, res) => {
    try {
        const { userId } = req.query;
        res.status(200).json([]);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: 'Error fetching chats' });
    }
};