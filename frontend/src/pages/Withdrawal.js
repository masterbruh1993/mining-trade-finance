import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, Table, InfoBox } from '../components/UI';
import './Withdrawal.css';

const Withdrawal = () => {
  const { user } = useAuth();
  const [walletBalances, setWalletBalances] = useState({
    passive: 0,
    bonus: 0
  });
  const [withdrawalForm, setWithdrawalForm] = useState({
    walletType: 'passive',
    amount: '',
    payoutMethod: 'GCash',
    accountDetails: ''
  });
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [encashmentStatus, setEncashmentStatus] = useState({
    passiveWallet: {
      startTime: '11:00',
      endTime: '15:00',
      isEnabled: true,
      allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      overrideActive: false,
      overrideExpiry: null
    }
  });

  useEffect(() => {
    fetchWalletBalances();
    fetchWithdrawalHistory();
    fetchEncashmentStatus();
    
    // Check encashment status every 30 seconds for real-time sync
    const statusInterval = setInterval(fetchEncashmentStatus, 30000);
    return () => clearInterval(statusInterval);
  }, []);

  const fetchWalletBalances = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/v1/wallet/balances', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (res.data.success) {
        const { passiveWallet } = res.data.data;
        setWalletBalances({
          passive: passiveWallet || 0
        });
        console.log('Withdrawal page wallet balances updated:', { passiveWallet });
      }
    } catch (error) {
      console.error('Failed to fetch wallet balances:', error);
      setError('Failed to fetch wallet balances');
    }
  };

  const fetchWithdrawalHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/v1/withdrawals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWithdrawalHistory(res.data.data || []);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch withdrawal history');
      setLoading(false);
    }
  };

  const fetchEncashmentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/v1/encashment-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setEncashmentStatus(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch encashment status:', error);
      // If status fetch fails, default to not allowing withdrawals
      setEncashmentStatus({
        passiveWallet: {
          isAllowed: false,
          message: 'Unable to check encashment status. Please try again later.',
          settings: {
            startTime: '11:00',
            endTime: '15:00',
            isEnabled: false,
            allowedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            overrideActive: false,
            overrideExpiry: null
          }
        },

      });
    }
  };



  const getMinimumAmount = () => {
    return withdrawalForm.walletType === 'passive' ? 300 : 500;
  };

  const checkWalletEncashmentStatus = (walletType) => {
    const walletConfig = walletType === 'passive' 
      ? encashmentStatus.passiveWallet 
      : null;
    
    if (!walletConfig) {
      return { isAllowed: false, message: 'Encashment configuration not found' };
    }

    // Return the pre-computed status from backend
    return {
      isAllowed: walletConfig.isAllowed || false,
      message: walletConfig.message || 'Encashment status unavailable'
    };
  };

  const validateWithdrawal = () => {
    const amount = parseFloat(withdrawalForm.amount);
    const minAmount = getMinimumAmount();
    const balance = walletBalances[withdrawalForm.walletType];

    // Check wallet-specific encashment status
    const encashmentCheck = checkWalletEncashmentStatus(withdrawalForm.walletType);
    if (!encashmentCheck.isAllowed) {
      return encashmentCheck.message;
    }

    if (!amount || amount <= 0) {
      return 'Please enter a valid amount';
    }

    if (amount < minAmount) {
      return `Minimum withdrawal amount for ${withdrawalForm.walletType} wallet is ₱${minAmount}`;
    }

    if (amount > balance) {
      return 'Insufficient wallet balance';
    }

    if (!withdrawalForm.payoutMethod) {
      return 'Please select a payout method';
    }

    if (!withdrawalForm.accountDetails.trim()) {
      return 'Please provide account details';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const validationError = validateWithdrawal();
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/v1/withdrawals', {
        walletType: withdrawalForm.walletType,
        amount: parseFloat(withdrawalForm.amount),
        payoutMethod: withdrawalForm.payoutMethod,
        accountDetails: withdrawalForm.accountDetails
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Withdrawal request submitted successfully!');
      setWithdrawalForm({
        walletType: 'passive',
        amount: '',
        payoutMethod: 'GCash',
        accountDetails: ''
      });
      fetchWalletBalances();
      fetchWithdrawalHistory();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to submit withdrawal request';
      
      // Check if it's a daily limit error and provide wallet-specific message
      if (errorMessage.includes('daily withdrawal limit') || errorMessage.includes('already submitted')) {
        const walletName = 'Passive Wallet';
        setError(`You already submitted a ${walletName} request today. Please wait until tomorrow or contact admin if your previous request was cancelled/rejected.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'cancelled': return 'secondary';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="loading">Loading withdrawal data...</div>;
  }

  return (
    <div className="withdrawal-container">
      <div className="withdrawal-header">
        <h1>Withdrawal Request</h1>
        <p>Manage your wallet withdrawals and track your requests</p>
      </div>
      
      {/* Wallet-Specific Encashment Status */}
      <div className="encashment-status-grid">
        {/* Passive Wallet Encashment */}
        <InfoBox 
          icon={encashmentStatus.passiveWallet?.isAllowed ? "fas fa-check-circle" : "fas fa-exclamation-triangle"}
          title="Passive Wallet Encashment"
          variant={encashmentStatus.passiveWallet?.isAllowed ? "success" : "warning"}
          className="wallet-encashment-status"
        >
          {encashmentStatus.passiveWallet?.message || (
            encashmentStatus.passiveWallet?.isAllowed 
              ? (
                  <div>
                    <div>Withdrawals allowed</div>
                    <div style={{fontSize: '0.9em', marginTop: '0.5rem', color: '#b0b0b0'}}>
                      Time: {encashmentStatus.passiveWallet?.settings?.startTime} - {encashmentStatus.passiveWallet?.settings?.endTime}
                      {encashmentStatus.passiveWallet?.settings?.allowedDays && (
                        <div>Days: {encashmentStatus.passiveWallet.settings.allowedDays.map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ')}</div>
                      )}
                    </div>
                  </div>
                )
              : 'Passive wallet withdrawals not allowed'
          )}
        </InfoBox>


      </div>

      {/* Wallet Balances */}
      <div className="wallet-balances-grid">
        <Card variant="wallet" className="passive-wallet">
          <div className="wallet-header">
            <h3>Passive Wallet</h3>
            <i className="fas fa-wallet"></i>
          </div>
          <div className="balance-display">
            <span className="currency">₱</span>
            <span className="amount">{walletBalances.passive.toLocaleString()}</span>
          </div>
          <p className="wallet-info">Minimum withdrawal: ₱300</p>
        </Card>
        

      </div>

      {/* Withdrawal Form */}
      <Card variant="withdrawal" className="withdrawal-form-card">
        <div className="card-header">
          <h2>Request Withdrawal</h2>
          <p>Submit a new withdrawal request from your available wallets</p>
        </div>
        
        <form onSubmit={handleSubmit} className="withdrawal-form">
          <div className="form-group">
            <label htmlFor="walletType">
              <i className="fas fa-wallet"></i>
              Select Wallet
            </label>
            <select
              id="walletType"
              value={withdrawalForm.walletType}
              onChange={(e) => setWithdrawalForm({...withdrawalForm, walletType: e.target.value})}
              required
            >
              <option value="passive">Passive Wallet (₱{walletBalances.passive.toLocaleString()})</option>

            </select>
          </div>

          <div className="form-group">
            <label htmlFor="amount">
              <i className="fas fa-money-bill-wave"></i>
              Withdrawal Amount (₱)
            </label>
            <input
              type="number"
              id="amount"
              value={withdrawalForm.amount}
              onChange={(e) => setWithdrawalForm({...withdrawalForm, amount: e.target.value})}
              placeholder={`Minimum ₱${getMinimumAmount()}`}
              min={getMinimumAmount()}
              max={walletBalances[withdrawalForm.walletType]}
              step="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="payoutMethod">
              <i className="fas fa-credit-card"></i>
              Payout Method
            </label>
            <select
              id="payoutMethod"
              value={withdrawalForm.payoutMethod}
              onChange={(e) => setWithdrawalForm({...withdrawalForm, payoutMethod: e.target.value})}
              required
            >
              <option value="GCash">GCash</option>
              <option value="Maya">Maya</option>
              <option value="GoTyme">GoTyme</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="accountDetails">
              <i className="fas fa-user"></i>
              Account Details
            </label>
            <input
              type="text"
              id="accountDetails"
              value={withdrawalForm.accountDetails}
              onChange={(e) => setWithdrawalForm({...withdrawalForm, accountDetails: e.target.value})}
              placeholder="Enter your account number/mobile number"
              required
            />
          </div>

          {error && (
            <InfoBox variant="error" className="compact">
              {error}
            </InfoBox>
          )}
          {success && (
            <InfoBox variant="success" className="compact">
              {success}
            </InfoBox>
          )}

          <button 
            type="submit" 
            className={`submit-btn ${submitting ? 'submitting' : ''}`}
            disabled={submitting || !checkWalletEncashmentStatus(withdrawalForm.walletType).isAllowed}
          >
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                Submit Withdrawal Request
              </>
            )}
          </button>
        </form>
      </Card>

      {/* Withdrawal History */}
      <Card variant="earnings" className="withdrawal-history-card">
        <div className="card-header">
          <h2>Withdrawal History</h2>
          <p>Track your withdrawal requests and their status</p>
        </div>
        
        {withdrawalHistory.length === 0 ? (
          <div className="no-history">
            <div className="no-history-icon">
              <i className="fas fa-history"></i>
            </div>
            <h4>No Withdrawal History</h4>
            <p>You haven't made any withdrawal requests yet.</p>
          </div>
        ) : (
          <Table striped hover>
            <Table.Header>
              <Table.Row>
                <Table.Cell header>Amount</Table.Cell>
                <Table.Cell header>Wallet</Table.Cell>
                <Table.Cell header>Method</Table.Cell>
                <Table.Cell header>Account</Table.Cell>
                <Table.Cell header>Fee</Table.Cell>
                <Table.Cell header>Net Amount</Table.Cell>
                <Table.Cell header>Status</Table.Cell>
                <Table.Cell header>Date</Table.Cell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {withdrawalHistory.map((withdrawal) => (
                <Table.Row key={withdrawal._id}>
                  <Table.Cell>
                    <span className="amount negative">₱{withdrawal.amount.toLocaleString()}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className={`wallet-type ${withdrawal.walletType}`}>
                      {withdrawal.walletType.toUpperCase()}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{withdrawal.paymentMethod || withdrawal.payoutMethod}</Table.Cell>
                  <Table.Cell>
                    <span className="account-details">{withdrawal.paymentDetails?.accountNumber || withdrawal.accountDetails}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="amount negative">₱{withdrawal.fee?.toLocaleString() || '0'}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="amount positive">₱{withdrawal.netAmount?.toLocaleString() || withdrawal.amount.toLocaleString()}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className={`status-badge ${withdrawal.status?.toLowerCase()}`}>
                      {withdrawal.status?.toUpperCase()}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="date">{formatDate(withdrawal.createdAt)}</span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default Withdrawal;