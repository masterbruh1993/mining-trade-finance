import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/SuccessModal';
// ReferralLink component removed
import { Card, Table, InfoBox } from '../components/UI';
import './Dashboard.css';
import './ActiveContracts.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creditWallet, setCreditWallet] = useState(0);
  const [passiveWallet, setPassiveWallet] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [encashmentTotal, setEncashmentTotal] = useState(0);
  // referralLink state removed
  const [amount, setAmount] = useState('');
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [summary, setSummary] = useState({
    totalActiveContracts: 0,
    totalInvestment: 0,
    completedContracts: 0,
    totalPayoutsReceived: 0
  });

  useEffect(() => {
    fetchCreditWalletBalance();
    fetchWalletBalances();
    fetchActiveContracts();
    fetchSummary();
    // generateReferralLink removed
  }, []);

  // Add effect to refresh wallet balances when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Dashboard: Page became visible, refreshing wallet balances...');
        refreshWalletData();
      }
    };

    const handleFocus = () => {
      console.log('Dashboard: Window focused, refreshing wallet balances...');
      refreshWalletData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchCreditWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/wallet/credit', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (res.data.status === 'success') {
        setCreditWallet(res.data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch credit wallet balance:', error);
      setCreditWallet(0);
    }
  };

  const fetchWalletBalances = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Dashboard: Fetching wallet balances...');
      
      // First get wallet balances from the reliable /wallets/balances endpoint
      const walletRes = await axios.get('/api/v1/wallet/balances', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Then get additional dashboard data (earnings, encashment total)
      const dashboardRes = await axios.get('/api/v1/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Dashboard: Wallet API Response:', walletRes.data);
      console.log('Dashboard: Dashboard API Response:', dashboardRes.data);
      
      if (walletRes.data.success) {
        const { passiveWallet } = walletRes.data.data;
        setPassiveWallet(passiveWallet || 0);
        console.log('Dashboard: Updated wallet balances - Passive:', passiveWallet);
      }
      
      if (dashboardRes.data.status === 'success') {
        setTotalEarnings(dashboardRes.data.totalPayoutsReceived || 0);
        setEncashmentTotal(dashboardRes.data.encashmentTotal || 0);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balances:', error);
      setPassiveWallet(0);
      setTotalEarnings(0);
      setEncashmentTotal(0);
    }
  };

  // Alternative function to fetch wallet balances from /wallets/balances endpoint
  const fetchWalletBalancesFromWalletAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Dashboard: Fetching wallet balances from /wallets/balances...');
      const res = await axios.get('/api/v1/wallet/balances', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('Dashboard: Wallet API Response:', res.data);
      if (res.data.success) {
        const { creditWallet, passiveWallet } = res.data.data;
        setCreditWallet(creditWallet || 0);
        setPassiveWallet(passiveWallet || 0);
      }
    } catch (error) {
      console.error('Failed to fetch wallet balances from wallet API:', error);
    }
  };

  // Function to refresh all wallet data (can be called after withdrawal operations)
  const refreshWalletData = async () => {
    await Promise.all([
      fetchCreditWalletBalance(),
      fetchWalletBalances(),
      fetchWalletBalancesFromWalletAPI()
    ]);
  };

  // generateReferralLink function removed

  const fetchActiveContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/investments/active', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      if (res.data.status === 'success') {
        const contractsData = res.data.data || [];
        console.log('Fetched contracts:', contractsData.length, 'contracts');
        setContracts(contractsData);
      } else {
        console.warn('Failed to fetch contracts:', res.data.message);
        setContracts([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
      setContracts([]);
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/contracts/summary', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (res.data.success) {
        console.log('Summary updated:', res.data.data);
        setSummary(res.data.data);
      } else {
        console.warn('Failed to fetch summary:', res.data.message);
      }
    } catch (error) {
      console.error('Failed to fetch investment summary:', error);
    }
  };

  const validateAmount = (value) => {
    const amountNum = parseFloat(value);
    
    if (!value || value === '') {
      setValidationError('');
      return;
    }
    
    if (isNaN(amountNum) || amountNum <= 0) {
      setValidationError('Please enter a valid amount');
      return;
    }
    
    if (amountNum < 1000) {
      setValidationError('Minimum activation is ₱1,000');
      return;
    }
    
    if (amountNum > 100000) {
      setValidationError('Maximum activation is ₱100,000');
      return;
    }

    if (amountNum > creditWallet) {
      setValidationError('Insufficient Credit Wallet balance');
      return;
    }

    setValidationError('');
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    validateAmount(value);
  };

  const handleActivate = async () => {
    if (validationError || !amount) {
      setError(validationError || 'Please enter an amount');
      return;
    }

    setIsActivating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const amountNum = parseFloat(amount);
      
      const res = await axios.post('/api/v1/investments/activate', 
        { amount: amountNum }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.status === 'success') {
        // Update credit wallet balance immediately with the returned value
        setCreditWallet(res.data.data.updatedBalance);
        
        setSuccessData({
          amount: amountNum,
          updatedBalance: res.data.data.updatedBalance,
          investment: res.data.data.investment
        });
        setShowSuccessModal(true);
        setAmount('');
        setValidationError('');
        
        // Only refresh wallet balances, NOT the contracts list yet
        fetchWalletBalances();
        fetchCreditWalletBalance(); // Ensure credit wallet is refreshed from database
      } else {
        setError(res.data.message || 'Activation failed');
      }
    } catch (err) {
      console.error('Activation error:', err);
      if (err.response?.data?.status === 'failed') {
        setError(err.response.data.message);
      } else {
        setError('Failed to activate wallet funds: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsActivating(false);
    }
  };

  const closeSuccessModal = async () => {
    // Close modal with animation first
    setShowSuccessModal(false);
    setSuccessData(null);
    
    // Add small delay to ensure modal closes smoothly, then refresh data
    setTimeout(async () => {
      try {
        console.log('Refreshing Active Contracts after modal close...');
        await fetchActiveContracts();
        await fetchSummary();
        console.log('Active Contracts refreshed successfully');
      } catch (error) {
        console.error('Error refreshing contracts:', error);
      }
    }, 300); // 300ms delay to match modal animation
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#28a745';
      case 'completed': return '#007bff';
      case 'pending': return '#FFD700';
      default: return '#6c757d';
    }
  };

  const getNextPayoutCountdown = (contract) => {
    if (!contract.nextPayout?.date) return 'N/A';
    
    const now = new Date();
    const nextPayoutDate = new Date(contract.nextPayout.date);
    const diffTime = nextPayoutDate - now;
    
    if (diffTime <= 0) return 'Due now';
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffDays > 1) {
      return `${diffDays} days`;
    } else {
      return `${diffHours} hours`;
    }
  };

  const calculateDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header">
        <h1 className="luxury-heading">Investment Dashboard</h1>
        <p className="luxury-text">Track your premium gold investment portfolio</p>
      </div>
      
      {/* Earnings Summary */}
      <div className="luxury-grid luxury-grid-3 mb-4">
        <div className="luxury-card slide-up">
          <div className="card-header">
            <h3 className="luxury-subheading">Total Earnings</h3>
          </div>
          <div className="balance-display">
            <span className="luxury-number">₱{totalEarnings.toLocaleString()}</span>
          </div>
          <p className="luxury-text-small">Investment returns</p>
        </div>

        <div className="luxury-card slide-up">
          <div className="card-header">
            <h3 className="luxury-subheading">Encashment Total</h3>
          </div>
          <div className="balance-display">
            <span className="luxury-number">₱{encashmentTotal.toLocaleString()}</span>
          </div>
          <p className="luxury-text-small">Total withdrawn</p>
        </div>

        <div className="luxury-card slide-up">
          <div className="card-header">
            <h3 className="luxury-subheading">Active Contracts</h3>
          </div>
          <div className="balance-display">
            <span className="luxury-number">{contracts.length}</span>
          </div>
          <p className="luxury-text-small">Investment contracts</p>
        </div>
      </div>

      {/* Referral Link component removed */}
      {/* Activation form moved inside Active Contracts section */}

      {/* Active Contracts */}
      <div className="luxury-card">
        <div className="card-header">
          <h3 className="luxury-heading">Your Investment Contracts</h3>
          <p className="luxury-text">Premium gold investment portfolio</p>
        </div>
        
        {contracts.length === 0 ? (
          <div className="activation-section">
            <div className="no-contracts text-center mb-4">
              <div className="no-contracts-icon" style={{color: 'var(--luxury-gold)', fontSize: '3rem', marginBottom: '1rem'}}>
                <i className="fas fa-coins"></i>
              </div>
              <h4 className="luxury-subheading">Start Your Investment Journey</h4>
              <p className="luxury-text">Activate your first premium gold investment contract below.</p>
            </div>
            
            <div className="activation-form-container">
              <h4 className="luxury-heading mb-3">Premium Investment Plan</h4>
              
              <div className="luxury-card mb-3" style={{background: 'var(--luxury-charcoal)', border: '1px solid var(--luxury-gold)'}}>
                <div className="luxury-text-small mb-2">
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                    <span><strong>Duration:</strong></span>
                    <span className="luxury-number" style={{fontSize: '1rem'}}>60 days</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                    <span><strong>Profit:</strong></span>
                    <span className="luxury-number" style={{fontSize: '1rem'}}>300%</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                    <span><strong>Capital Return:</strong></span>
                    <span className="luxury-number" style={{fontSize: '1rem'}}>100%</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderTop: '1px solid var(--luxury-gold)', paddingTop: '0.5rem'}}>
                    <span><strong>Total Return:</strong></span>
                    <span className="luxury-number" style={{fontSize: '1.2rem'}}>400%</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span><strong>Investment Range:</strong></span>
                    <span className="luxury-text">₱25,000 - ₱500,000</span>
                  </div>
                </div>
              </div>
              
              <div className="activation-form">
                <input
                  type="number"
                  placeholder="Enter investment amount (₱25,000 - ₱500,000)"
                  value={amount}
                  onChange={handleAmountChange}
                  min="25000"
                  max="500000"
                  className="luxury-input mb-2"
                  style={{fontSize: '1.1rem', textAlign: 'center'}}
                />
                {validationError && (
                  <div className="luxury-error mb-2">
                    <i className="fas fa-exclamation-triangle"></i> {validationError}
                  </div>
                )}
                {error && (
                  <div className="luxury-error mb-2">
                    <i className="fas fa-exclamation-triangle"></i> {error}
                  </div>
                )}
                {success && (
                  <div className="luxury-success mb-2">
                    <i className="fas fa-check-circle"></i> {success}
                  </div>
                )}
                {amount && !validationError && (
                  <div className="expected-return mb-3" style={{textAlign: 'center', padding: '1rem', background: 'var(--luxury-charcoal)', border: '1px solid var(--luxury-gold)', borderRadius: '8px'}}>
                    <div className="luxury-text-small mb-1">Expected Return:</div>
                    <div className="luxury-number" style={{fontSize: '1.5rem'}}>₱{(amount * 4).toLocaleString()}</div>
                    <div className="luxury-text-small">400% after 60 days</div>
                  </div>
                )}
                <button 
                  onClick={handleActivate}
                  disabled={isActivating || validationError || !amount}
                  className="luxury-btn luxury-btn-primary w-100"
                  style={{fontSize: '1.1rem', padding: '0.75rem'}}
                >
                  {isActivating ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Activating Investment...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-coins"></i>
                      Activate Investment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="luxury-grid">
            {contracts.map((contract) => (
              <div key={contract.id} className="luxury-card contract-card fade-in">
                <div className="contract-header mb-3">
                  <div className="luxury-number" style={{fontSize: '1.8rem', marginBottom: '0.5rem'}}>
                    ₱{contract.amount.toLocaleString()}
                  </div>
                  <div className="luxury-text-small" style={{textAlign: 'center'}}>
                    Investment Capital
                  </div>
                  <div 
                    className="contract-status mt-2"
                    style={{ color: getStatusColor(contract.status), fontWeight: 'bold', textAlign: 'center' }}
                  >
                    {contract.status}
                  </div>
                </div>

                <div className="expected-return mb-3" style={{textAlign: 'center'}}>
                  <div className="luxury-text-small mb-1">Expected Return</div>
                  <div className="luxury-number" style={{fontSize: '2rem', marginBottom: '0.5rem'}}>
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
                    <span className="luxury-number" style={{fontSize: '0.9rem'}}>{calculateDaysRemaining(contract.maturityDate)} days</span>
                  </div>
                </div>

                {contract.status === 'ACTIVE' && calculateDaysRemaining(contract.maturityDate) === 0 && (
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
      </div>

      {/* Investment Summary */}
      <div className="contracts-summary mt-4">
        <h3 className="luxury-heading mb-3">Investment Portfolio Summary</h3>
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



      {/* Success Modal */}
      {showSuccessModal && successData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={closeSuccessModal}
          title="Contract Activated Successfully!"
          message={`Your contract of ₱${successData.amount?.toLocaleString()} has been activated successfully.`}
          details={{
            amount: successData.amount,
            updatedBalance: successData.updatedBalance
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;