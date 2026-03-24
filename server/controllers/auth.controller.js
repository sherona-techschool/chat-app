const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const nodemailer = require('nodemailer');
const User       = require('../models/User');

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret-key';

// In-memory OTP store: { email: { otp, expiresAt, verified } }
// For production consider Redis or a DB collection
const otpStore = new Map();

// ── Nodemailer transporter ─────────────────────────────────────────────────
// Add to .env:
//   EMAIL_USER=your-gmail@gmail.com
//   EMAIL_PASS=your-gmail-app-password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

const otpEmailHtml = (otp) => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#0066ff;font-size:28px;margin:0;">ConnectApp</h1>
    </div>
    <div style="background:#fff;border-radius:10px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <h2 style="margin:0 0 8px;color:#1e293b;">Password Reset OTP</h2>
      <p style="color:#64748b;margin:0 0 24px;">
        Use the code below to reset your password. It expires in <strong>10 minutes</strong>.
      </p>
      <div style="text-align:center;background:#f0f7ff;border-radius:10px;padding:20px;margin-bottom:24px;">
        <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0066ff;">${otp}</span>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin:0;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  </div>
`;


// REGISTER

exports.register = async (req, res) => {
    try {
        const { username, fullName, email, phone, password } = req.body;

        if (!username || !fullName || !email || !password || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists (email or username)' });
        }

        const salt           = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username, fullName, email, phone,
            password: hashedPassword,
            status: 'online',
        });

        const token = jwt.sign(
            { userId: newUser._id, username: newUser.username },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(201).json({ userId: newUser._id, username: newUser.username, token });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
};


// LOGIN

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch      = await bcrypt.compare(password, user.password);
        const isPlainMatch = user.password === password; // legacy plain-text fallback

        if (!isMatch && !isPlainMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({ userId: user._id, username: user.username, token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
};

// UPDATE PROFILE

exports.updateProfile = async (req, res) => {
    try {
        const { userId }                    = req.params;
        const { fullName, bio, status, avatar } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (fullName) user.fullName = fullName;
        if (bio)      user.bio      = bio;
        if (status)   user.status   = status;
        if (avatar)   user.avatar   = avatar;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                _id:      user._id,
                username: user.username,
                fullName: user.fullName,
                email:    user.email,
                avatar:   user.avatar,
                bio:      user.bio,
                status:   user.status,
            },
        });

    } catch (error) {
        console.error('Update Profile error:', error);
        res.status(500).json({ message: 'Failed to update profile' });
    }
};


// FORGOT PASSWORD — Step 1: Send OTP
// POST /api/auth/forgot-password   body: { email }
// ─────────────────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });

      
        if (!user) {
            return res.status(200).json({ message: 'If that email is registered, an OTP has been sent.' });
        }

        const otp       = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        otpStore.set(email.toLowerCase(), { otp, expiresAt, verified: false });

        await transporter.sendMail({
            from:    process.env.EMAIL_FROM || `ConnectApp <${process.env.EMAIL_USER}>`,
            to:      email,
            subject: 'Your ConnectApp Password Reset OTP',
            html:    otpEmailHtml(otp),
        });

        console.log(`[ForgotPassword] OTP sent to ${email}`);
        res.status(200).json({ message: 'OTP sent to your email address.' });

    } catch (error) {
        console.error('[ForgotPassword] Error:', error);
        res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }
};


// VERIFY OTP — Step 2
// POST /api/auth/verify-otp   body: { email, otp }

exports.verifyOtp = (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const record = otpStore.get(email.toLowerCase());

        if (!record) {
            return res.status(400).json({ message: 'No OTP requested for this email. Please start over.' });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(email.toLowerCase());
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (record.otp !== otp.trim()) {
            return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
        }

        // Mark verified so reset step can proceed
        record.verified = true;
        otpStore.set(email.toLowerCase(), record);

        res.status(200).json({ message: 'OTP verified successfully.' });

    } catch (error) {
        console.error('[VerifyOTP] Error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};


// RESET PASSWORD — Step 3
// POST /api/auth/reset-password   body: { email, newPassword }

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const record = otpStore.get(email.toLowerCase());

        if (!record || !record.verified) {
            return res.status(400).json({ message: 'Please verify your OTP first.' });
        }
        if (Date.now() > record.expiresAt) {
            otpStore.delete(email.toLowerCase());
            return res.status(400).json({ message: 'Session expired. Please start over.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        otpStore.delete(email.toLowerCase());

        console.log(`[ResetPassword] ✅ Password reset for ${email}`);
        res.status(200).json({ message: 'Password reset successfully. You can now log in.' });

    } catch (error) {
        console.error('[ResetPassword] Error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
};

