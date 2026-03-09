import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 5 * 60 * 1000;  // Show warning 5 minutes before timeout

/**
 * Session timeout hook - warns users before auto-logout after inactivity
 */
export function useSessionTimeout() {
  const { user, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (!user) return;
    clearAllTimers();
    setShowWarning(false);

    // Warning timer
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingSeconds(Math.floor(WARNING_MS / 1000));
      
      countdownRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, TIMEOUT_MS - WARNING_MS);

    // Logout timer
    timeoutRef.current = setTimeout(() => {
      setShowWarning(false);
      signOut();
    }, TIMEOUT_MS);
  }, [user, signOut, clearAllTimers]);

  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!user) {
      clearAllTimers();
      setShowWarning(false);
      return;
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    // Debounced activity tracker
    let activityTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (activityTimeout) return;
      activityTimeout = setTimeout(() => {
        activityTimeout = null;
        if (!showWarning) resetTimer(); // Don't reset if warning is showing
      }, 1000);
    };

    events.forEach(event => document.addEventListener(event, handleActivity, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity));
      clearAllTimers();
      if (activityTimeout) clearTimeout(activityTimeout);
    };
  }, [user, resetTimer, clearAllTimers, showWarning]);

  return { showWarning, remainingSeconds, extendSession };
}
