import React, { useState } from 'react';
import '../styles/theme.css';
import ForgotPasswordModal from './ForgotPasswordModal'; // adjust path if needed

const Auth = ({ onLogin }) => {
    const [isLogin,  setIsLogin]  = useState(true);
    const [formData, setFormData] = useState({
        email: '', password: '', fullName: '', username: '', phone: ''
    });
    const [error,        setError]        = useState('');
    const [loading,      setLoading]      = useState(false);
    const [showForgot,   setShowForgot]   = useState(false); // ✅ controls modal

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.email || !formData.password) {
            setError('Email and password are required');
            setLoading(false);
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Invalid email format');
            setLoading(false);
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }
        if (!isLogin && (!formData.fullName || !formData.username || !formData.phone)) {
            setError('All fields are required');
            setLoading(false);
            return;
        }

        const endpoint = isLogin
            ? `${import.meta.env.VITE_API_URL}/api/auth/login`
            : `${import.meta.env.VITE_API_URL}/api/auth/register`;

        const body = isLogin
            ? { email: formData.email, password: formData.password }
            : formData;

        try {
            const response = await fetch(endpoint, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Something went wrong');

            if (isLogin) {
                localStorage.setItem('token',  data.token);
                localStorage.setItem('userId', data.userId);
                onLogin(data.userId);
            } else {
                setIsLogin(true);
                setError('');
                alert('Registration successful! Please login.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="auth-wrapper">

                {/* Left Side - Brand */}
                <div className="auth-left">
                    <div className="brand-content">
                        <h1>ConnectApp</h1>
                        <h2>Connect with the world instantly.</h2>
                        <p>Secure, fast, and reliable messaging for teams and individuals.</p>
                        <div className="illustration-placeholder">
                            <div style={{ fontSize: '50px' }}>💬</div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="auth-right">
                    <div className="auth-box">
                        <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                        <p className="auth-subtitle">
                            {isLogin ? 'Please enter your credentials.' : 'Get started with your free account.'}
                        </p>

                        {/* Toggle */}
                        <div className="auth-toggle">
                            <button
                                className={`toggle-btn ${isLogin ? 'active' : ''}`}
                                onClick={() => { setIsLogin(true); setError(''); }}
                            >
                                Login
                            </button>
                            <button
                                className={`toggle-btn ${!isLogin ? 'active' : ''}`}
                                onClick={() => { setIsLogin(false); setError(''); }}
                            >
                                Register
                            </button>
                        </div>

                        {error && <div className="error-msg">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {!isLogin && (
                                <>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Username</label>
                                        <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="johndoe123" required />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone</label>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1234567890" required />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" required />
                            </div>

                            <div className="form-group">
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                                    <label style={{ margin:0 }}>Password</label>
                                    {/* ✅ Forgot Password link — only shows on login */}
                                    {isLogin && (
                                        <span
                                            onClick={() => setShowForgot(true)}
                                            style={{ fontSize:13, color:'#0066ff', cursor:'pointer', fontWeight:500 }}
                                        >
                                            Forgot password?
                                        </span>
                                    )}
                                </div>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
                            </div>

                            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                                {loading ? 'Processing...' : (isLogin ? 'Sign In →' : 'Create Account →')}
                            </button>
                        </form>

                        <p className="auth-footer">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span onClick={() => setIsLogin(!isLogin)} className="link">
                                {isLogin ? 'Create an account' : 'Login'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* ✅ Forgot Password Modal — mounts on top when showForgot = true */}
            {showForgot && (
                <ForgotPasswordModal onClose={() => setShowForgot(false)} />
            )}
        </>
    );
};

export default Auth;