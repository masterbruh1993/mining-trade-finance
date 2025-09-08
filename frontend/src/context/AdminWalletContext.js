import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  masterWalletBalance: 0,
  transactions: [],
  loading: false,
  error: null
};

// Action types
const ADMIN_WALLET_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  DEDUCT_FUNDS: 'DEDUCT_FUNDS',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  LOAD_WALLET_DATA: 'LOAD_WALLET_DATA',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const adminWalletReducer = (state, action) => {
  switch (action.type) {
    case ADMIN_WALLET_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case ADMIN_WALLET_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case ADMIN_WALLET_ACTIONS.DEDUCT_FUNDS:
      const newBalance = state.masterWalletBalance - action.payload.amount;
      if (newBalance < 0) {
        return {
          ...state,
          error: 'Insufficient funds in Admin Master Wallet'
        };
      }
      return {
        ...state,
        masterWalletBalance: newBalance,
        error: null
      };
    case ADMIN_WALLET_ACTIONS.ADD_TRANSACTION:
      return {
        ...state,
        transactions: [action.payload, ...state.transactions]
      };
    case ADMIN_WALLET_ACTIONS.LOAD_WALLET_DATA:
      return {
        ...state,
        masterWalletBalance: action.payload.balance || initialState.masterWalletBalance,
        transactions: action.payload.transactions || [],
        loading: false
      };
    case ADMIN_WALLET_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Create context
const AdminWalletContext = createContext();

// Provider component
export const AdminWalletProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminWalletReducer, initialState);
  const { isAuthenticated, userRole, token } = useAuth();

  // Load wallet data from backend API when user is authenticated as admin
  useEffect(() => {
    const fetchWalletData = async () => {
      // Only fetch if user is authenticated and has admin role
      if (!isAuthenticated || userRole !== 'admin' || !token) {
        return;
      }

      try {
        dispatch({ type: ADMIN_WALLET_ACTIONS.SET_LOADING, payload: true });
        
        const response = await axios.get('http://localhost:5000/api/v1/dashboard/admin/wallet', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          dispatch({
            type: ADMIN_WALLET_ACTIONS.LOAD_WALLET_DATA,
            payload: {
              balance: response.data.data.balance,
              transactions: response.data.data.transactions
            }
          });
        }
      } catch (error) {
        console.error('Error loading admin wallet data:', error);
        dispatch({
          type: ADMIN_WALLET_ACTIONS.SET_ERROR,
          payload: 'Failed to load wallet data'
        });
      } finally {
        dispatch({ type: ADMIN_WALLET_ACTIONS.SET_LOADING, payload: false });
      }
    };
    
    fetchWalletData();
  }, [isAuthenticated, userRole, token]); // Re-run when auth state changes

  // Refresh wallet data function
  const refreshWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/v1/dashboard/admin/wallet', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        dispatch({
          type: ADMIN_WALLET_ACTIONS.LOAD_WALLET_DATA,
          payload: {
            balance: response.data.data.balance,
            transactions: response.data.data.transactions
          }
        });
      }
    } catch (error) {
      console.error('Error refreshing wallet data:', error);
    }
  };

  // Action creators
  const deductFunds = async (amount, userId, userName, description = 'Payment approval') => {
    if (amount <= 0) {
      dispatch({
        type: ADMIN_WALLET_ACTIONS.SET_ERROR,
        payload: 'Invalid amount'
      });
      return false;
    }

    try {
      dispatch({ type: ADMIN_WALLET_ACTIONS.SET_LOADING, payload: true });
      
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/v1/dashboard/admin/wallet/deduct', {
        amount,
        userId,
        userName,
        description
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        // Refresh wallet data to get updated balance and transactions
        await refreshWalletData();
        dispatch({ type: ADMIN_WALLET_ACTIONS.CLEAR_ERROR });
        return true;
      } else {
        dispatch({
          type: ADMIN_WALLET_ACTIONS.SET_ERROR,
          payload: response.data.message || 'Failed to deduct funds'
        });
        return false;
      }
    } catch (error) {
      console.error('Error deducting funds:', error);
      dispatch({
        type: ADMIN_WALLET_ACTIONS.SET_ERROR,
        payload: error.response?.data?.message || 'Failed to deduct funds'
      });
      return false;
    }
  };

  const addFunds = async (amount, userId, userName, description = 'Deposit received') => {
    if (amount <= 0) {
      dispatch({
        type: ADMIN_WALLET_ACTIONS.SET_ERROR,
        payload: 'Invalid amount'
      });
      return false;
    }

    try {
      dispatch({ type: ADMIN_WALLET_ACTIONS.SET_LOADING, payload: true });
      
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/v1/dashboard/admin/wallet/add', {
        amount,
        userId,
        userName,
        description
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        // Refresh wallet data to get updated balance and transactions
        await refreshWalletData();
        dispatch({ type: ADMIN_WALLET_ACTIONS.CLEAR_ERROR });
        return true;
      } else {
        dispatch({
          type: ADMIN_WALLET_ACTIONS.SET_ERROR,
          payload: response.data.message || 'Failed to add funds'
        });
        return false;
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      dispatch({
        type: ADMIN_WALLET_ACTIONS.SET_ERROR,
        payload: error.response?.data?.message || 'Failed to add funds'
      });
      return false;
    }
  };

  const clearError = () => {
    dispatch({
      type: ADMIN_WALLET_ACTIONS.CLEAR_ERROR
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const value = {
    ...state,
    deductFunds,
    addFunds,
    clearError,
    formatCurrency,
    refreshWalletData
  };

  return (
    <AdminWalletContext.Provider value={value}>
      {children}
    </AdminWalletContext.Provider>
  );
};

// Custom hook to use the context
export const useAdminWallet = () => {
  const context = useContext(AdminWalletContext);
  if (!context) {
    throw new Error('useAdminWallet must be used within an AdminWalletProvider');
  }
  return context;
};

export default AdminWalletContext;