import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../assets/LOGO.png';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Hide navbar for admin users
  if (isAdmin) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <img 
            src={Logo} 
            alt="Mining Trade Finance Logo" 
            height="40" 
            style={{ objectFit: 'contain', cursor: 'pointer' }} 
            className="navbar-logo"
          />
        </Link>
        
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="navbar-item">
                Dashboard
              </Link>
              <Link to="/wallet" className="navbar-item">
                Wallet
              </Link>
              <Link to="/withdrawal" className="navbar-item">
                Withdrawal
              </Link>
              <Link to="/transactions" className="navbar-item">
                Transactions
              </Link>
              <Link to="/active-contracts" className="navbar-item">
                Active Contracts
              </Link>
              <Link to="/settings" className="navbar-item">
                Settings
              </Link>
              <Link to="/about-token" className="navbar-item">
                About Token
              </Link>
              <div className="navbar-user">
                <span className="user-name">Welcome, {user?.username}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-item">
                Login
              </Link>
              {/* Register link moved to Settings page */}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;