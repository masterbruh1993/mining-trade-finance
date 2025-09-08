import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, InfoBox } from '../components/UI';
import './ActiveContracts.css';

const ActiveContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [summary, setSummary] = useState({
    totalActiveContracts: 0,
    totalInvestment: 0,
    completedContracts: 0,
    totalPayoutsReceived: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActiveContracts();
    fetchSummary();
    // Set up interval to update countdown timers every minute
    const interval = setInterval(() => {
      setContracts(prevContracts => [...prevContracts]); // Force re-render for countdown updates
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchActiveContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/investments/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.status === 'success') {
        setContracts(res.data.data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch active contracts:', error);
      setError('Failed to load contracts');
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/contracts/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch investment summary:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextPayoutCountdown = (contract) => {
    if (!contract.nextPayout) return 'No pending payouts';
    
    if (contract.nextPayout.status === 'due') {
      return 'Payout Due!';
    }

    if (contract.nextPayout.timeLeft) {
      return contract.nextPayout.timeLeft.formatted;
    }

    return 'Calculating...';
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  const getProgressPercentage = (contract) => {
    if (!contract.startDate || !contract.maturityDate) return 0;
    
    const now = new Date();
    const startDate = new Date(contract.startDate);
    const maturityDate = new Date(contract.maturityDate);
    const totalDuration = maturityDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    
    const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    return Math.round(percentage);
  };

  if (loading) {
    return (
      <div className="active-contracts">
        <div className="loading">Loading contracts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="active-contracts">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="active-contracts luxury-container">
      <div className="page-header text-center mb-4 fade-in">
        <h1 className="luxury-title">Premium Investment Contracts</h1>
        <p className="luxury-text">Monitor your gold investment portfolio and returns</p>
      </div>

      {contracts.length === 0 ? (
        <div className="luxury-card text-center">
          <div className="no-contracts-content">
            <div className="luxury-icon mb-3" style={{color: 'var(--luxury-gold)', fontSize: '4rem'}}>
              <i className="fas fa-coins"></i>
            </div>
            <h3 className="luxury-heading">No Active Investments</h3>
            <p className="luxury-text">Start your premium gold investment journey to see your contracts here.</p>
          </div>
        </div>
      ) : (
        <div className="luxury-grid">
          {contracts.map((contract) => (
            <div key={contract.id} className="luxury-card contract-card slide-up">
              <div className="contract-header mb-3 text-center">
                <div className="luxury-number" style={{fontSize: '2rem', marginBottom: '0.5rem'}}>
                  ₱{contract.amount.toLocaleString()}
                </div>
                <div className="luxury-text-small mb-2">Investment Capital</div>
                <div 
                  className="contract-status"
                  style={{ color: getStatusColor(contract.status), fontWeight: 'bold', fontSize: '0.9rem' }}
                >
                  {contract.status}
                </div>
              </div>

              <div className="expected-return mb-3 text-center">
                <div className="luxury-text-small mb-1">Expected Return</div>
                <div className="luxury-number" style={{fontSize: '2.2rem', marginBottom: '0.5rem'}}>
                  ₱{(contract.amount * 4).toLocaleString()}
                </div>
                <div className="luxury-text-small">
                  ₱{(contract.amount * 3).toLocaleString()} profit + ₱{contract.amount.toLocaleString()} capital
                </div>
              </div>

              <div className="progress-section mb-3">
                <div className="progress-header mb-2" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span className="luxury-text-small">Investment Progress</span>
                  <span className="luxury-number" style={{fontSize: '1rem'}}>{getProgressPercentage(contract)}%</span>
                </div>
                <div className="luxury-progress-bar">
                  <div 
                    className="luxury-progress-fill"
                    style={{ width: `${getProgressPercentage(contract)}%` }}
                  ></div>
                </div>
              </div>

              <div className="contract-details" style={{borderTop: '1px solid var(--luxury-gold)', paddingTop: '1rem'}}>
                <div className="detail-row mb-1" style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span className="luxury-text-small">Start Date:</span>
                  <span className="luxury-text-small">{formatDate(contract.startDate)}</span>
                </div>
                <div className="detail-row mb-1" style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span className="luxury-text-small">Maturity Date:</span>
                  <span className="luxury-text-small">{formatDate(contract.maturityDate)}</span>
                </div>
                <div className="detail-row" style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span className="luxury-text-small">Days Remaining:</span>
                  <span className="luxury-number" style={{fontSize: '0.9rem'}}>{contract.daysLeft} days</span>
                </div>
              </div>

              {contract.status === 'ACTIVE' && contract.daysLeft === 0 && (
                <div className="maturity-notice mt-3" style={{textAlign: 'center', padding: '1rem', background: '#0D0D0D', color: '#FFD700', borderRadius: '8px', border: '1px solid #C5A100'}}>
                  <div className="maturity-header" style={{fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem'}}>Investment Matured!</div>
                  <div className="maturity-amount" style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>
                    ₱{(contract.amount * 4).toLocaleString()}
                  </div>
                  <div className="maturity-text">Ready for withdrawal</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="contracts-summary mt-4">
        <h3 className="luxury-heading mb-3 text-center">Portfolio Overview</h3>
        <div className="luxury-grid">
          <div className="luxury-card text-center">
            <div className="luxury-icon mb-2" style={{color: 'var(--luxury-gold)', fontSize: '2rem'}}>
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="luxury-number" style={{fontSize: '2rem', marginBottom: '0.5rem'}}>
              {summary.totalActiveContracts || 0}
            </div>
            <div className="luxury-text-small">Active Contracts</div>
          </div>
          <div className="luxury-card text-center">
            <div className="luxury-icon mb-2" style={{color: 'var(--luxury-gold)', fontSize: '2rem'}}>
              <i className="fas fa-coins"></i>
            </div>
            <div className="luxury-number" style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>
              ₱{(summary.totalInvestment || 0).toLocaleString()}
            </div>
            <div className="luxury-text-small">Total Investment</div>
          </div>
          <div className="luxury-card text-center">
            <div className="luxury-icon mb-2" style={{color: 'var(--luxury-gold)', fontSize: '2rem'}}>
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="luxury-number" style={{fontSize: '2rem', marginBottom: '0.5rem'}}>
              {summary.completedContracts || 0}
            </div>
            <div className="luxury-text-small">Completed Contracts</div>
          </div>
          <div className="luxury-card text-center">
            <div className="luxury-icon mb-2" style={{color: 'var(--luxury-gold)', fontSize: '2rem'}}>
              <i className="fas fa-trophy"></i>
            </div>
            <div className="luxury-number" style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>
              ₱{(summary.totalPayoutsReceived || 0).toLocaleString()}
            </div>
            <div className="luxury-text-small">Total Returns Received</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveContracts;