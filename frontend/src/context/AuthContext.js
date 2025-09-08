import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        userRole: action.payload.userRole,
        error: null
      };
    case 'LOGIN_FAIL':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        userRole: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        userRole: null,
        loading: false,
        error: null
      };
    case 'LOAD_USER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        userRole: action.payload.userRole,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
  userRole: null,
  loading: true, // Set to true initially to show loading while checking token
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token in axios headers
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Load user on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Check if token is valid by decoding it
          const decodedToken = jwtDecode(token);
          
          // Check if token is expired
          if (decodedToken.exp * 1000 < Date.now()) {
            // Token is expired, remove it
            localStorage.removeItem('token');
            dispatch({ type: 'LOGOUT' });
            return;
          }
          
          // Token is valid, load user data
          await loadUser();
        } catch (error) {
          // Invalid token, remove it
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        // No token, set loading to false
        dispatch({ type: 'LOGOUT' });
      }
    };
    
    initializeAuth();
  }, []);

  const login = async (emailOrUsername, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const res = await axios.post('/api/v1/auth/login', {
        emailOrUsername,
        password
      });
      
      const { token, data } = res.data;
      
      // Decode JWT to extract role
      const decodedToken = jwtDecode(token);
      const userRole = decodedToken.role;
      
      localStorage.setItem('token', token);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: data,
          token,
          userRole
        }
      });
      
      return { success: true, userRole, redirectTo: userRole === 'admin' ? '/admin' : '/dashboard' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAIL',
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (fullName, mobileNumber, username, email, password, referralCode = '') => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const requestData = {
        fullName,
        mobileNumber,
        username,
        email,
        password
      };
      
      // Only include referralCode if it's provided and not empty
      if (referralCode && referralCode.trim() !== '') {
        requestData.referralCode = referralCode.trim();
      }
      
      const res = await axios.post('/api/v1/auth/register', requestData);
      
      // Registration successful - don't auto-login, just return success
      dispatch({ type: 'CLEAR_ERROR' });
      
      return { 
        success: true, 
        message: res.data.message || 'User registered successfully! Please login.',
        warning: res.data.warning
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      dispatch({
        type: 'LOGIN_FAIL',
        payload: errorMessage
      });
      return { success: false, message: errorMessage };
    }
  };

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      
      // Decode JWT to extract role
      const decodedToken = jwtDecode(token);
      const userRole = decodedToken.role;
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const res = await axios.get('/api/v1/auth/me', config);
      dispatch({
        type: 'LOAD_USER',
        payload: {
          user: res.data.data,
          userRole
        }
      });
    } catch (error) {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        loadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};