import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const useSessionTimeout = (timeoutMinutes = 30) => {
  const { logout, isAuthenticated, isAdmin } = useAuth();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const TIMEOUT_DURATION = timeoutMinutes * 60 * 1000; // Convert to milliseconds
  const WARNING_DURATION = 5 * 60 * 1000; // 5 minutes before timeout

  const resetTimeout = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Only set timeout for authenticated admin users
    if (isAuthenticated && isAdmin) {
      // Set warning timeout (5 minutes before actual timeout)
      warningTimeoutRef.current = setTimeout(() => {
        const confirmStayLoggedIn = window.confirm(
          'Your session will expire in 5 minutes due to inactivity. Click OK to stay logged in.'
        );
        
        if (confirmStayLoggedIn) {
          resetTimeout(); // Reset the timeout if user wants to stay
        }
      }, TIMEOUT_DURATION - WARNING_DURATION);

      // Set actual logout timeout
      timeoutRef.current = setTimeout(() => {
        alert('Your session has expired due to inactivity. You will be logged out.');
        logout();
      }, TIMEOUT_DURATION);
    }
  }, [isAuthenticated, isAdmin, logout, TIMEOUT_DURATION, WARNING_DURATION]);

  const handleActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only reset if enough time has passed to avoid excessive resets
    if (timeSinceLastActivity > 60000) { // 1 minute threshold
      resetTimeout();
    }
  }, [resetTimeout]);

  useEffect(() => {
    // Initialize timeout when component mounts or auth state changes
    if (isAuthenticated && isAdmin) {
      resetTimeout();
    } else {
      // Clear timeouts when user is not authenticated or not admin
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [isAuthenticated, isAdmin, resetTimeout]);

  useEffect(() => {
    // Activity event listeners
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Add event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      // Cleanup event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [handleActivity]);

  // Return function to manually reset timeout (useful for API calls)
  return {
    resetTimeout,
    timeRemaining: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, TIMEOUT_DURATION - elapsed);
    }
  };
};

export default useSessionTimeout;