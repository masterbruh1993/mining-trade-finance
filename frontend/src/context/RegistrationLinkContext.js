import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  mainRegistrationLink: null,
  linkStats: {
    totalClicks: 0,
    totalRegistrations: 0,
    createdAt: null,
    lastUsed: null
  },
  loading: false,
  error: null
};

// Action types
const REGISTRATION_LINK_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  GENERATE_LINK: 'GENERATE_LINK',
  UPDATE_STATS: 'UPDATE_STATS',
  LOAD_LINK_DATA: 'LOAD_LINK_DATA',
  CLEAR_ERROR: 'CLEAR_ERROR',
  RESET_LINK: 'RESET_LINK'
};

// Reducer
const registrationLinkReducer = (state, action) => {
  switch (action.type) {
    case REGISTRATION_LINK_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case REGISTRATION_LINK_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case REGISTRATION_LINK_ACTIONS.GENERATE_LINK:
      return {
        ...state,
        mainRegistrationLink: action.payload.link,
        linkStats: {
          ...action.payload.stats,
          createdAt: new Date().toISOString()
        },
        loading: false,
        error: null
      };
    case REGISTRATION_LINK_ACTIONS.UPDATE_STATS:
      return {
        ...state,
        linkStats: {
          ...state.linkStats,
          ...action.payload,
          lastUsed: new Date().toISOString()
        }
      };
    case REGISTRATION_LINK_ACTIONS.LOAD_LINK_DATA:
      return {
        ...state,
        mainRegistrationLink: action.payload.link,
        linkStats: action.payload.stats || initialState.linkStats,
        loading: false
      };
    case REGISTRATION_LINK_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    case REGISTRATION_LINK_ACTIONS.RESET_LINK:
      return {
        ...state,
        mainRegistrationLink: null,
        linkStats: {
          totalClicks: 0,
          totalRegistrations: 0,
          createdAt: null,
          lastUsed: null
        },
        error: null
      };
    default:
      return state;
  }
};

// Create context
const RegistrationLinkContext = createContext();

// Provider component
export const RegistrationLinkProvider = ({ children }) => {
  const [state, dispatch] = useReducer(registrationLinkReducer, initialState);

  // Load registration link data from localStorage on mount
  useEffect(() => {
    const savedLinkData = localStorage.getItem('registrationLinkData');
    if (savedLinkData) {
      try {
        const linkData = JSON.parse(savedLinkData);
        dispatch({
          type: REGISTRATION_LINK_ACTIONS.LOAD_LINK_DATA,
          payload: linkData
        });
      } catch (error) {
        console.error('Error loading registration link data:', error);
      }
    }
  }, []);

  // Save registration link data to localStorage whenever state changes
  useEffect(() => {
    const linkData = {
      link: state.mainRegistrationLink,
      stats: state.linkStats
    };
    localStorage.setItem('registrationLinkData', JSON.stringify(linkData));
  }, [state.mainRegistrationLink, state.linkStats]);

  // Generate a unique registration link
  const generateRegistrationLink = () => {
    dispatch({ type: REGISTRATION_LINK_ACTIONS.SET_LOADING, payload: true });
    
    try {
      // Generate a unique identifier for the link
      const linkId = generateUniqueId();
      const baseUrl = window.location.origin;
      const registrationLink = `${baseUrl}/register?ref=main&linkId=${linkId}`;
      
      const linkData = {
        link: registrationLink,
        stats: {
          totalClicks: 0,
          totalRegistrations: 0,
          createdAt: new Date().toISOString(),
          lastUsed: null
        }
      };
      
      dispatch({
        type: REGISTRATION_LINK_ACTIONS.GENERATE_LINK,
        payload: linkData
      });
      
      return registrationLink;
    } catch (error) {
      dispatch({
        type: REGISTRATION_LINK_ACTIONS.SET_ERROR,
        payload: 'Failed to generate registration link'
      });
      return null;
    }
  };

  // Generate unique ID for the link
  const generateUniqueId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}`;
  };

  // Update link statistics
  const updateLinkStats = (type) => {
    const updates = {};
    
    if (type === 'click') {
      updates.totalClicks = state.linkStats.totalClicks + 1;
    } else if (type === 'registration') {
      updates.totalRegistrations = state.linkStats.totalRegistrations + 1;
    }
    
    dispatch({
      type: REGISTRATION_LINK_ACTIONS.UPDATE_STATS,
      payload: updates
    });
  };

  // Reset the registration link
  const resetRegistrationLink = () => {
    dispatch({ type: REGISTRATION_LINK_ACTIONS.RESET_LINK });
  };

  // Copy link to clipboard
  const copyLinkToClipboard = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (fallbackError) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: REGISTRATION_LINK_ACTIONS.CLEAR_ERROR });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Calculate conversion rate
  const getConversionRate = () => {
    if (state.linkStats.totalClicks === 0) return 0;
    return ((state.linkStats.totalRegistrations / state.linkStats.totalClicks) * 100).toFixed(1);
  };

  const value = {
    ...state,
    generateRegistrationLink,
    updateLinkStats,
    resetRegistrationLink,
    copyLinkToClipboard,
    clearError,
    formatDate,
    getConversionRate
  };

  return (
    <RegistrationLinkContext.Provider value={value}>
      {children}
    </RegistrationLinkContext.Provider>
  );
};

// Custom hook to use the context
export const useRegistrationLink = () => {
  const context = useContext(RegistrationLinkContext);
  if (!context) {
    throw new Error('useRegistrationLink must be used within a RegistrationLinkProvider');
  }
  return context;
};

export default RegistrationLinkContext;