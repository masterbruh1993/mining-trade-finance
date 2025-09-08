import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === 'success') {
        setProfile({
          firstName: res.data.data.firstName || '',
          lastName: res.data.data.lastName || '',
          email: res.data.data.email || '',
          mobile: res.data.data.mobile || ''
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setError('Failed to load profile data');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/v1/auth/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'success') {
        setSuccess('Profile updated successfully!');
      } else {
        setError(res.data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };



  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="luxury-container settings-container">
      <div className="settings-header text-center mb-4 fade-in">
        <h1 className="luxury-title">Account Settings</h1>
        <p className="luxury-text">Manage your premium investment account</p>
      </div>

      <div className="settings-content luxury-grid">
        <div className="luxury-card profile-card slide-up">
          <div className="luxury-card-header">
            <i className="fas fa-user-circle luxury-icon" style={{color: 'var(--luxury-gold-light)', fontSize: '24px'}}></i>
            <h2 className="luxury-heading">Profile Information</h2>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="luxury-form-group">
              <label htmlFor="firstName" className="luxury-label">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={profile.firstName}
                onChange={handleInputChange}
                className="luxury-input"
                required
              />
            </div>

            <div className="luxury-form-group">
              <label htmlFor="lastName" className="luxury-label">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={profile.lastName}
                onChange={handleInputChange}
                className="luxury-input"
                required
              />
            </div>

            <div className="luxury-form-group">
              <label htmlFor="email" className="luxury-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                className="luxury-input"
                required
              />
            </div>

            <div className="luxury-form-group">
              <label htmlFor="mobile" className="luxury-label">Mobile Number</label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={profile.mobile}
                onChange={handleInputChange}
                className="luxury-input"
                required
              />
            </div>

            {error && (
              <div className="luxury-alert luxury-alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
              </div>
            )}
            {success && (
              <div className="luxury-alert luxury-alert-success">
                <i className="fas fa-check-circle"></i>
                {success}
              </div>
            )}

            <button 
              type="submit" 
              className="luxury-btn luxury-btn-primary"
              disabled={isUpdating}
            >
              <i className="fas fa-save"></i>
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        <div className="luxury-card account-info-card slide-up">
          <div className="luxury-card-header">
            <i className="fas fa-info-circle luxury-icon" style={{color: 'var(--luxury-gold-light)', fontSize: '24px'}}></i>
            <h2 className="luxury-heading">Account Information</h2>
          </div>
          <div className="luxury-info-list">
            <div className="luxury-info-item">
              <span className="luxury-label">User ID:</span>
              <span className="luxury-value">{user?.id || 'N/A'}</span>
            </div>
            <div className="luxury-info-item">
              <span className="luxury-label">Account Type:</span>
              <span className="luxury-value luxury-text-gold">{user?.role || 'Premium Investor'}</span>
            </div>
            <div className="luxury-info-item">
              <span className="luxury-label">Member Since:</span>
              <span className="luxury-value">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="luxury-card referral-card slide-up">
          <div className="luxury-card-header">
            <i className="fas fa-share-alt luxury-icon" style={{color: 'var(--luxury-gold-light)', fontSize: '24px'}}></i>
            <h2 className="luxury-heading">Referral Program</h2>
          </div>
          <div className="referral-content">
            <p className="luxury-text mb-3">Share your referral link and earn rewards for every successful referral!</p>
            <div className="referral-link-container">
              <div className="luxury-form-group">
                <label className="luxury-label">Your Referral Link:</label>
                <div className="referral-input-group">
                  <input 
                    type="text" 
                    value={`https://miningtradefinance.com/register?ref=${user?.id || 'USER123'}`}
                    className="luxury-input referral-input"
                    readOnly
                  />
                  <button 
                    className="luxury-btn luxury-btn-gold copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://miningtradefinance.com/register?ref=${user?.id || 'USER123'}`);
                      setSuccess('Referral link copied to clipboard!');
                      setTimeout(() => setSuccess(''), 3000);
                    }}
                  >
                    <i className="fas fa-copy"></i>
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;