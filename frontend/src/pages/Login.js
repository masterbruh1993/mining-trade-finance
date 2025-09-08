import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Captcha from '../components/Captcha';
import AnimatedCircularFrame from '../components/AnimatedCircularFrame';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check captcha verification
    if (!captchaVerified) {
      showError('Please complete the security verification');
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

    try {
      const result = await login(formData.emailOrUsername, formData.password);
      if (result.success) {
        showSuccess('Login successful, redirecting...', 2000);
        setTimeout(() => {
          navigate(result.redirectTo);
        }, 1500);
      } else {
        showError(result.error || 'Invalid email/username or password.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid email/username or password.';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <AnimatedCircularFrame isLoading={loading} className="login-frame">
        <div className="auth-card">
          <div className="auth-header">
          <h2>Login</h2>
        </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                id="emailOrUsername"
                name="emailOrUsername"
                placeholder="Email or Username"
                value={formData.emailOrUsername}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <Captcha 
              onVerify={setCaptchaVerified} 
              isVerified={captchaVerified}
            />
            
            <button 
              type="submit" 
              className="auth-btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              Don't have an account? 
              <Link to="/register" className="auth-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </AnimatedCircularFrame>
    </div>
  );
};

export default Login;