import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';
import '../styles/PlasmaAura.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section">
        {/* Landing Page Plasma Background */}
        <div className="landing-plasma-bg">
          <div className="landing-plasma-orb"></div>
          <div className="landing-plasma-orb"></div>
          <div className="landing-plasma-orb"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="brand-highlight">1Uptrade-v3</span>
          </h1>
          <p className="hero-subtitle">
            Your trusted investment platform for secure and profitable trading
          </p>
          <p className="hero-description">
            Start your investment journey with as little as ₱1,000 and watch your money grow 
            with our 15-day investment plans offering competitive returns.
          </p>
          
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-large">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-large">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
        
        <div className="hero-image">
          <div className="investment-card-demo">
            <div className="demo-card">
              <div className="demo-icon">📈</div>
              <h3>Investment Plan</h3>
              <div className="demo-amount">₱100,000</div>
              <div className="demo-return">Expected Return: ₱400,000</div>
              <div className="demo-duration">60 Days</div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Mining Trade Finance?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure Platform</h3>
              <p>Your investments are protected with bank-level security and encryption.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Low Minimum Investment</h3>
              <p>Start investing with ₱25,000 and achieve substantial returns.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Transparent Returns</h3>
              <p>Clear 400% total returns on 60-day investment cycles with no hidden fees.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Quick Processing</h3>
              <p>Fast deposit and withdrawal processing for your convenience.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>User-Friendly Interface</h3>
              <p>Easy-to-use platform designed for both beginners and experienced investors.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Focused Investment</h3>
              <p>Specialized 60-day investment plans with substantial returns.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="investment-info-section">
        <div className="container">
          <h2 className="section-title">Investment Details</h2>
          
          <div className="info-cards">
            <div className="info-card">
              <h3>💵 Investment Range</h3>
              <div className="info-details">
                <p><strong>Minimum:</strong> ₱25,000</p>
                <p><strong>Maximum:</strong> ₱500,000</p>
              </div>
            </div>
            
            <div className="info-card">
              <h3>📅 Investment Period</h3>
              <div className="info-details">
                <p><strong>Duration:</strong> 60 Days</p>
                <p><strong>Total Return:</strong> 400%</p>
              </div>
            </div>
            
            <div className="info-card">
              <h3>💎 Expected Returns</h3>
              <div className="info-details">
                <p><strong>₱1,000 → ₱1,100</strong></p>
                <p><strong>₱10,000 → ₱11,000</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="cta-section">
          <div className="container">
            <h2>Ready to Start Investing?</h2>
            <p>Join thousands of satisfied investors and start growing your wealth today.</p>
            <Link to="/register" className="btn btn-primary btn-large">
              Create Your Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;