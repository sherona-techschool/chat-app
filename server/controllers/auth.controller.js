const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-key';

exports.register = async (req, res) => {
    try {
        const { username, fullName, email, phone, password } = req.body;

        if (!username || !fullName || !email || !password || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        console.log(existingUser, ' Test')
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists (email or username)' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            fullName,
            email,
            phone,
            password: hashedPassword,
            status: 'online'
        });

        const token = jwt.sign(
            { userId: newUser._id, username: newUser.username },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            userId: newUser._id,
            username: newUser.username,
            token
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.log('Login failed: User not found for email:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        
        const isMatch = await bcrypt.compare(password, user.password);

        
        const isPlainMatch = user.password === password;

        if (!isMatch && !isPlainMatch) {
            console.log('Login failed: Password mismatch for user:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({
            userId: user._id,
            username: user.username,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { fullName, bio, status, avatar } = req.body;


        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (fullName) user.fullName = fullName;
        if (bio) user.bio = bio;
        if (status) user.status = status;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Update Profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
};
