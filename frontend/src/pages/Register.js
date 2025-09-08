import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle referral code from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }));
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };



  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long and contain at least 1 special character.';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must be at least 8 characters long and contain at least 1 special character.';
    }
    return null;
  };

  const validateMobileNumber = (mobileNumber) => {
    if (!mobileNumber) {
      return 'Please provide your mobile number';
    }
    if (!/^09\d{9}$/.test(mobileNumber)) {
      return 'Invalid mobile number format';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);



    // Validate mobile number
    const mobileError = validateMobileNumber(formData.mobileNumber);
    if (mobileError) {
      showError(mobileError);
      setLoading(false);
      return;
    }

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      showError(passwordError);
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData.fullName, formData.mobileNumber, formData.username, formData.email, formData.password, formData.referralCode);
      if (result.success) {
        showSuccess(result.message || 'User registered successfully! Please login.');
        
        // Show warning if there was an issue with referral code
        if (result.warning) {
          setTimeout(() => {
            showError(result.warning);
          }, 500);
        }
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        showError(result.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed: Server error';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>SIGN UP</h2>
          <p className="auth-subtitle">Fill out the form to register</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="text"
              id="mobileNumber"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              placeholder="Mobile Number (09XXXXXXXXX)"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password (min 8 characters, 1 special character)"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              required
            />
          </div>
          
          <div className="form-group">
            <input
              type="text"
              id="referralCode"
              name="referralCode"
              value={formData.referralCode}
              onChange={handleChange}
              placeholder="Referral Code (Optional)"
            />
          </div>
          

          
          <button 
            type="submit" 
            className="auth-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p className="signin-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in instead
            </Link>
          </p>
          
          <div className="footer-links">
            <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
            <span className="footer-separator">•</span>
            <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>
              Terms and Conditions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;