import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SuccessModal from '../components/SuccessModal';
import './Wallet.css';

const Wallet = () => {
  const { user } = useAuth();
  const [creditBalance, setCreditBalance] = useState(0);
  const [passiveBalance, setPassiveBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [passiveTransactions, setPassiveTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReceipt, setDepositReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [activeTab, setActiveTab] = useState('credit');

  useEffect(() => {
    fetchAllWalletBalances();
    fetchTransactions();
    fetchPassiveTransactions();
  }, []);

  // Add effect to refresh balance when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAllWalletBalances();
      }
    };

    const handleFocus = () => {
      fetchAllWalletBalances();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchAllWalletBalances = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Wallet: Fetching wallet balances...');
      const res = await axios.get('/api/v1/wallet/balances', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('Wallet: API Response:', res.data);
      if (res.data.success) {
        const { creditWallet, passiveWallet, walletBalance } = res.data.data;
    setCreditBalance(creditWallet || 0);
    setPassiveBalance(passiveWallet || 0);
    // bonusBalance removed
    setTotalBalance(walletBalance || 0);
    console.log('Wallet balances updated:', { creditWallet, passiveWallet, walletBalance });
      }
    } catch (error) {
      console.error('Failed to fetch wallet balances:', error);
      setError('Failed to fetch wallet data');
    }
  };

  const fetchPassiveTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/wallet/passive', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (res.data.status === 'success') {
        setPassiveTransactions(res.data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch passive wallet transactions:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setLoading(false);
    }
  };

  const handleDepositSubmit = async () => {
    if (!depositAmount || !depositReceipt) {
      setDepositError('Please enter amount and upload payment proof');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError('Please enter a valid amount');
      return;
    }

    if (amount < 100) {
      setDepositError('Minimum deposit amount is ₱100');
      return;
    }

    setIsSubmitting(true);
    setDepositError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('receipt', depositReceipt);
      formData.append('type', 'deposit');
      formData.append('description', `Deposit request of ₱${amount.toLocaleString()}`);

      const res = await axios.post('/api/v1/payments/deposit', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.status === 'success') {
        setSuccessData({
          amount: amount,
          message: 'Deposit request submitted successfully! Your deposit will be processed within 24 hours.'
        });
        setShowSuccessModal(true);
        setDepositAmount('');
        setDepositReceipt(null);
        // Reset file input
        const fileInput = document.getElementById('receipt-upload');
        if (fileInput) fileInput.value = '';
        // Refresh balance and transactions after successful deposit
        fetchAllWalletBalances();
        fetchTransactions();
      } else {
        setDepositError(res.data.message || 'Deposit submission failed');
      }
    } catch (err) {
      console.error('Deposit error:', err);
      if (err.response?.data?.message) {
        setDepositError(err.response.data.message);
      } else {
        setDepositError('Failed to submit deposit request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
  };



  if (loading) {
    return <div className="loading">Loading wallet data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="wallet-container">
      <div className="wallet-header">
        <h1>My Wallets</h1>
        <p>Manage your wallet balances and transaction history</p>
      </div>

      {/* Wallet Overview Cards */}
      <div className="wallet-overview">
        <div className="overview-card total">
          <h3>Total Balance</h3>
          <div className="balance-amount">
            <span className="currency">₱</span>
            <span className="amount">{totalBalance.toLocaleString()}</span>
          </div>
        </div>
        <div className="overview-card credit">
          <h3>Credit Wallet</h3>
          <div className="balance-amount">
            <span className="currency">₱</span>
            <span className="amount">{creditBalance.toLocaleString()}</span>
          </div>
        </div>
        <div className="overview-card passive">
          <h3>Passive Wallet</h3>
          <div className="balance-amount">
            <span className="currency">₱</span>
            <span className="amount">{passiveBalance.toLocaleString()}</span>
          </div>
        </div>
        {/* Bonus Wallet removed */}
      </div>

      {/* Wallet Tabs */}
      <div className="wallet-tabs">
        <button 
          className={`tab-button ${activeTab === 'credit' ? 'active' : ''}`}
          onClick={() => setActiveTab('credit')}
        >
          Credit Wallet
        </button>
        <button 
          className={`tab-button ${activeTab === 'passive' ? 'active' : ''}`}
          onClick={() => setActiveTab('passive')}
        >
          Passive Wallet
        </button>
      </div>

      {/* Credit Wallet Content */}
      {activeTab === 'credit' && (
        <>
          {/* Deposit Form */}
          <div className="deposit-form-card">
        <div className="deposit-header">
          <h3>Deposit Funds</h3>
          <p>Add funds to your credit wallet to start investing</p>
        </div>
        
        <div className="deposit-form">
          <div className="form-group">
            <label htmlFor="deposit-amount">Deposit Amount</label>
            <input
              id="deposit-amount"
              type="number"
              placeholder="Enter deposit amount (minimum ₱100)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              min="100"
              className="deposit-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="receipt-upload">Payment Proof</label>
            <input
              id="receipt-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setDepositReceipt(e.target.files[0])}
              className="file-input"
            />
            <p className="file-help">Upload screenshot or photo of your payment receipt</p>
          </div>
          
          {depositError && (
            <div className="error-message">
              {depositError}
            </div>
          )}
          
          <button
            onClick={handleDepositSubmit}
            disabled={isSubmitting || !depositAmount || !depositReceipt}
            className={`deposit-btn ${isSubmitting ? 'submitting' : ''}`}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-upload"></i>
                Submit Deposit
              </>
            )}
          </button>
        </div>
      </div>

          <div className="transactions-section">
            <h3>Credit Wallet Transaction History</h3>
            {transactions.length === 0 ? (
              <div className="no-transactions">
                <p>No transactions found.</p>
              </div>
            ) : (
              <div className="transactions-list">
                {transactions.map((transaction, index) => (
                  <div key={index} className="transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-type">
                        <span className={`type-badge ${transaction.type}`}>
                          {transaction.type}
                        </span>
                      </div>
                      <div className="transaction-details">
                        <p className="transaction-amount">
                          <span className={['deposit', 'earning', 'referral'].includes(transaction.type?.toLowerCase()) ? 'positive' : 'negative'}>
                            {['deposit', 'earning', 'referral'].includes(transaction.type?.toLowerCase()) ? '+' : '-'}₱{transaction.amount?.toLocaleString()}
                          </span>
                        </p>
                        <p className="transaction-date">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {transaction.description && (
                      <p className="transaction-description">{transaction.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Passive Wallet Content */}
      {activeTab === 'passive' && (
        <>
          <div className="passive-wallet-info">
            <div className="passive-info-card">
              <h3>💰 Passive Wallet</h3>
              <p>Your passive wallet automatically receives earnings from your active investment contracts. Earnings are credited every 3 days according to your contract schedule.</p>
              
              <div className="passive-stats">
                <div className="stat-item">
                  <span className="stat-label">Current Balance:</span>
                  <span className="stat-value">₱{passiveBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="transactions-section">
            <h3>Passive Wallet Earnings History</h3>
            {passiveTransactions.length === 0 ? (
              <div className="no-transactions">
                <p>No earnings received yet. Activate investment contracts to start earning!</p>
              </div>
            ) : (
              <div className="transactions-list">
                {passiveTransactions.map((transaction, index) => (
                  <div key={index} className="transaction-item earnings">
                    <div className="transaction-info">
                      <div className="transaction-type">
                        <span className="type-badge earnings">
                          Earnings
                        </span>
                      </div>
                      <div className="transaction-details">
                        <p className="transaction-amount">
                          <span className="positive">
                            +₱{transaction.amount?.toLocaleString()}
                          </span>
                        </p>
                        <p className="transaction-date">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {transaction.description && (
                      <p className="transaction-description">{transaction.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="wallet-info-section">
        <h2>Wallet Information</h2>
        <div className="info-grid">
          <div className="info-card">
            <h4>💳 Credit Wallet</h4>
            <p>Your main wallet for activating investment contracts. Deposit funds here to start investing.</p>
          </div>
          
          <div className="info-card">
            <h4>💰 Passive Wallet</h4>
            <p>Automatically receives earnings from your active contracts. Payouts occur every 3 days.</p>
          </div>
          
          {/* Bonus Wallet info removed */}
          
          <div className="info-card">
            <h4>📊 How It Works</h4>
            <p>1. Deposit to Credit Wallet<br/>2. Activate contracts on Dashboard<br/>3. Earn passive income automatically</p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={closeSuccessModal}
          title="Deposit Request Submitted!"
          message={successData.message}
          details={[
            `Deposit Amount: ₱${successData.amount?.toLocaleString()}`,
            'Status: Pending Review',
            'Processing Time: Within 24 hours',
            'You will receive a notification once processed'
          ]}
        />
      )}
    </div>
  );
};

export default Wallet;