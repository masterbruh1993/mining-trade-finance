import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Transactions.css';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, deposit, withdrawal, activation, earning, referral

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/v1/transactions';
      if (filter !== 'all') {
        url += `?type=${filter}`;
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch transactions');
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/v1/transactions/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(res.data.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
        return '💰';
      case 'withdrawal':
        return '💸';
      case 'investment':
      case 'activation':
        return '📈';
      case 'return':
      case 'earnings':
      case 'payout':
        return '💎';
      case 'transfer':
      case 'referral':
      case 'commission':
        return '🔄';
      default:
        return '📄';
    }
  };

  const getTransactionColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'deposit':
      case 'earning':
      case 'referral':
        return 'positive'; // Green for inflow
      case 'withdrawal':
      case 'activation':
        return 'negative'; // Red for outflow
      default:
        return 'neutral';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
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

  const formatAmount = (amount, type) => {
    const inflowTypes = ['deposit', 'earning', 'referral'];
    const sign = inflowTypes.includes(type?.toLowerCase()) ? '+' : '-';
    return `${sign}₱${Math.abs(amount).toLocaleString()}`;
  };

  // Transactions are already filtered by the API
  const filteredTransactions = transactions;

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h1>Transaction History</h1>
        <p>View all your financial transactions and activities</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Transactions
        </button>
        <button 
          className={`filter-tab ${filter === 'deposit' ? 'active' : ''}`}
          onClick={() => setFilter('deposit')}
        >
          Deposits
        </button>
        <button 
          className={`filter-tab ${filter === 'activation' ? 'active' : ''}`}
          onClick={() => setFilter('activation')}
        >
          Activations
        </button>
        <button 
          className={`filter-tab ${filter === 'earning' ? 'active' : ''}`}
          onClick={() => setFilter('earning')}
        >
          Earnings
        </button>
        <button 
          className={`filter-tab ${filter === 'referral' ? 'active' : ''}`}
          onClick={() => setFilter('referral')}
        >
          Referrals
        </button>
        <button 
          className={`filter-tab ${filter === 'withdrawal' ? 'active' : ''}`}
          onClick={() => setFilter('withdrawal')}
        >
          Withdrawals
        </button>
      </div>

      {/* Transactions List */}
      <div className="transactions-section">
        {filteredTransactions.length === 0 ? (
          <div className="no-transactions">
            <div className="no-transactions-icon">📄</div>
            <h3>No transactions found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't made any transactions yet. Start by making your first investment!"
                : `No ${filter} transactions found. Try selecting a different filter.`
              }
            </p>
          </div>
        ) : (
          <div className="transactions-list">
            {filteredTransactions.map((transaction) => (
              <div key={transaction._id} className="transaction-item">
                <div className="transaction-icon">
                  {getTransactionIcon(transaction.type)}
                </div>
                
                <div className="transaction-details">
                  <div className="transaction-main">
                    <h4>{transaction?.type ? transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) : "Unknown"}</h4>
                    <p className="transaction-description">
                      {transaction.description || `${transaction?.type || "Unknown"} transaction`}
                    </p>
                  </div>
                  
                  <div className="transaction-meta">
                    <span className="transaction-date">
                      {formatDate(transaction.createdAt)}
                    </span>
                    <span className="transaction-wallet">
                      {transaction.walletType} wallet
                    </span>
                  </div>
                </div>
                
                <div className="transaction-amount">
                  <span className={`amount ${getTransactionColor(transaction.type)}`}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </span>
                  <span className={`status ${getStatusColor(transaction.status)}`}>
                    {transaction.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Summary */}
      {summary && (
        <div className="transaction-summary">
          <h3>Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Transactions:</span>
              <span className="summary-value">{summary.totalTransactions}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Deposits:</span>
              <span className="summary-value positive">
                +₱{summary.totalDeposits.toLocaleString()}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Withdrawals:</span>
              <span className="summary-value negative">
                -₱{summary.totalWithdrawals.toLocaleString()}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Activations:</span>
              <span className="summary-value neutral">
                {summary.totalActivations} contracts
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Earnings:</span>
              <span className="summary-value positive">
                +₱{summary.totalEarnings.toLocaleString()}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Referrals:</span>
              <span className="summary-value positive">
                +₱{summary.totalReferrals.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;