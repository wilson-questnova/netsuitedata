'use client';

import { useEffect, useState } from 'react';

// Session configuration (should match middleware)
const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  MAX_SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  WARNING_TIME: 5 * 60 * 1000, // Show warning 5 minutes before expiry
  CHECK_INTERVAL: 60 * 1000, // Check session every minute
};

interface SessionManagerProps {
  children: React.ReactNode;
}

export default function SessionManager({ children }: SessionManagerProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  /**
   * Check session status by making a request to the server
   */
  const checkSessionStatus = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/session-check', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.status === 401) {
        return false; // Session expired
      }
      
      return response.ok;
    } catch (error) {
      console.error('Session check failed:', error);
      return false;
    }
  };

  /**
   * Handle session expiry
   */
  const handleSessionExpiry = () => {
    setIsSessionExpired(true);
    setShowWarning(false);
    
    // Clear any local storage or session data
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect to login (refresh page to trigger auth)
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  /**
   * Extend session by making a request
   */
  const extendSession = async () => {
    try {
      const response = await fetch('/api/extend-session', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        setShowWarning(false);
        setTimeRemaining(null);
        console.log('Session extended successfully');
      } else {
        handleSessionExpiry();
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      handleSessionExpiry();
    }
  };

  /**
   * Track user activity to reset inactivity timer
   */
  useEffect(() => {
    let lastActivity = Date.now();
    const checkTimer: { current: NodeJS.Timeout | null } = { current: null };

    const updateActivity = () => {
      lastActivity = Date.now();
      setShowWarning(false);
      setTimeRemaining(null);
    };

    const checkSession = async () => {
      const timeSinceActivity = Date.now() - lastActivity;
      const timeUntilExpiry = SESSION_CONFIG.INACTIVITY_TIMEOUT - timeSinceActivity;
      
      // Check if session is still valid on server
      const isValid = await checkSessionStatus();
      if (!isValid) {
        handleSessionExpiry();
        return;
      }
      
      // Show warning if close to expiry
      if (timeUntilExpiry <= SESSION_CONFIG.WARNING_TIME && timeUntilExpiry > 0) {
        setShowWarning(true);
        setTimeRemaining(Math.ceil(timeUntilExpiry / 1000));
      } else if (timeUntilExpiry <= 0) {
        handleSessionExpiry();
      }
    };

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Set up periodic session checking
    checkTimer.current = setInterval(checkSession, SESSION_CONFIG.CHECK_INTERVAL);

    // Initial session check
    checkSession();

    return () => {
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      
      if (checkTimer.current) clearInterval(checkTimer.current);
    };
  }, []);

  /**
   * Update countdown timer
   */
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    
    if (showWarning && timeRemaining !== null) {
      countdownTimer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleSessionExpiry();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [showWarning, timeRemaining]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {children}
      
      {/* Session Warning Modal */}
      {showWarning && timeRemaining !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Session Expiring Soon</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Your session will expire in <span className="font-mono font-bold text-red-600">{formatTime(timeRemaining)}</span> due to inactivity.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={extendSession}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={handleSessionExpiry}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Session Expired Modal */}
      {isSessionExpired && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Session Expired</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Your session has expired due to inactivity or maximum session duration. You will be redirected to login.
            </p>
            
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}