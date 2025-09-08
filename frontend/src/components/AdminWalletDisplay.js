import React, { useState } from 'react';
import { useAdminWallet } from '../context/AdminWalletContext';
import './AdminWalletDisplay.css';

const AdminWalletDisplay = () => {
  const { masterWalletBalance, transactions, formatCurrency, addFunds, error, clearError } = useAdminWallet();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [showTransactions, setShowTransactions] = useState(false);

  const handleAddFunds = (e) => {
    e.preventDefault();
    const amount = parseFloat(addAmount);
    if (amount && amount > 0) {
      const success = addFunds(amount, 'Manual funds addition by admin');
      if (success) {
        setAddAmount('');
        setShowAddFunds(false);
      }
    }
  };

  const getBalanceStatus = () => {
    if (masterWalletBalance >= 50000000) return 'high';
    if (masterWalletBalance >= 10000000) return 'medium';
    return 'low';
  };

  return (
    <div className="admin-wallet-display">
      <div className="wallet-header">
        <div className="wallet-icon">
          <i className="fas fa-wallet"></i>
        </div>
        <div className="wallet-info">
          <h3>Admin Master Wallet</h3>
          <div className={`wallet-balance ${getBalanceStatus()}`}>
            {formatCurrency(masterWalletBalance)}
          </div>
        </div>
        <div className="wallet-actions">
          <button 
            className="btn-add-funds"
            onClick={() => setShowAddFunds(!showAddFunds)}
            title="Add Funds"
          >
            <i className="fas fa-plus"></i>
          </button>
          <button 
            className="btn-transactions"
            onClick={() => setShowTransactions(!showTransactions)}
            title="View Transactions"
          >
            <i className="fas fa-history"></i>
          </button>
        </div>
      </div>

      {error && (
        <div className="wallet-error">
          <span>{error}</span>
          <button onClick={clearError} className="btn-close-error">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {showAddFunds && (
        <div className="add-funds-form">
          <form onSubmit={handleAddFunds}>
            <div className="form-group">
              <label>Add Funds Amount</label>
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter amount to add"
                min="1"
                step="0.01"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-confirm">
                Add Funds
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => {
                  setShowAddFunds(false);
                  setAddAmount('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showTransactions && (
        <div className="wallet-transactions">
          <div className="transactions-header">
            <h4>Recent Transactions</h4>
            <button 
              className="btn-close"
              onClick={() => setShowTransactions(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="transactions-list">
            {transactions.length === 0 ? (
              <div className="no-transactions">
                <i className="fas fa-inbox"></i>
                <p>No transactions yet</p>
              </div>
            ) : (
              transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                  <div className="transaction-info">
                    <div className="transaction-type">
                      <i className={`fas ${transaction.type === 'deduction' ? 'fa-minus-circle' : 'fa-plus-circle'}`}></i>
                      <span>{transaction.description}</span>
                    </div>
                    {transaction.userName && (
                      <div className="transaction-user">
                        User: {transaction.userName}
                      </div>
                    )}
                    <div className="transaction-date">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="transaction-amounts">
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'deduction' ? '-' : '+'}{formatCurrency(transaction.amount)}
                    </div>
                    <div className="balance-after">
                      Balance: {formatCurrency(transaction.balanceAfter)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWalletDisplay;