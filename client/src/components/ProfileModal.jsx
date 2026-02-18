import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/theme.css'; // Ensure we have styles

const ProfileModal = ({ userId, isOpen, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        bio: '',
        avatar: '',
        status: 'online'
    });
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Fetch current user data when modal opens
    useEffect(() => {
        if (isOpen && userId) {
            fetchUserData();
            setIsEditing(false); // Reset to view mode on open
        }
    }, [isOpen, userId]);

    const fetchUserData = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
            const me = res.data.find(u => u._id === userId);
            if (me) {
                setFormData({
                    fullName: me.name || '',
                    bio: me.bio || '',
                    avatar: me.avatar || '',
                    status: me.status || 'online'
                });
            }
        } catch (error) {
            console.error("Failed to fetch user data", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile/${userId}`, formData);
            if (onUpdate) onUpdate(res.data.user);
            setIsEditing(false); // Switch back to view mode
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content profile-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Profile</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                <div className="profile-content-scroll">
                    <div className="profile-avatar-container">
                        <img
                            src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.fullName}`}
                            alt="Profile"
                            className="profile-avatar-large"
                        />
                    </div>

                    {!isEditing ? (
                        /* View Mode */
                        <div className="profile-details">
                            <h2 className="profile-name">{formData.fullName}</h2>
                            <p className="profile-status status-badge">{formData.status}</p>

                            <div className="profile-section">
                                <label>Bio</label>
                                <p className="profile-bio">{formData.bio || "No bio available"}</p>
                            </div>

                            <button onClick={() => setIsEditing(true)} className="btn-primary full-width">
                                Edit Profile
                            </button>
                        </div>
                    ) : (
                        /* Edit Mode */
                        <form onSubmit={handleSubmit} className="profile-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Tell us about yourself"
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Avatar URL</label>
                                <input
                                    type="text"
                                    name="avatar"
                                    value={formData.avatar}
                                    onChange={handleChange}
                                    placeholder="https://example.com/avatar.png"
                                />
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                    <option value="busy">Busy</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
