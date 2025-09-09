// Auth guard hook to handle automatic logout and session expiry
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

interface AuthGuardOptions {
  redirectTo?: string;
  showToast?: (message: string, type: 'info' | 'warning' | 'error') => void;
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();
  
  const { redirectTo = '/signin', showToast } = options;

  useEffect(() => {
    let sessionCheckInterval: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔐 Auth state changed:', currentUser ? 'User logged in' : 'No user');
      
      if (currentUser) {
        try {
          // Force token refresh to check if it's still valid
          await currentUser.getIdToken(true);
          setUser(currentUser);
          setSessionExpired(false);
          
          // Set up periodic session validation (every 5 minutes)
          sessionCheckInterval = setInterval(async () => {
            try {
              await currentUser.getIdToken(true);
              console.log('✅ Session still valid');
            } catch (error) {
              console.log('❌ Session expired during periodic check');
              handleSessionExpiry();
            }
          }, 5 * 60 * 1000); // 5 minutes
          
        } catch (error) {
          console.log('❌ Invalid token detected, logging out');
          handleSessionExpiry();
        }
      } else {
        // No user - check if this was an unexpected logout
        const wasLoggedIn = localStorage.getItem('wasLoggedIn') === 'true';
        if (wasLoggedIn && !sessionExpired) {
          handleSessionExpiry();
        } else {
          setUser(null);
          localStorage.removeItem('wasLoggedIn');
        }
      }
      
      setLoading(false);
    });

    const handleSessionExpiry = () => {
      console.log('🚪 Handling session expiry');
      setSessionExpired(true);
      setUser(null);
      
      // Clear local storage
      localStorage.removeItem('wasLoggedIn');
      localStorage.removeItem('serviceType');
      
      // Clear session check interval
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
      
      // Show toast notification
      if (showToast) {
        showToast('Your session has expired. Please sign in again.', 'warning');
      }
      
      // Sign out from Firebase to ensure clean state
      auth.signOut().catch(console.error);
      
      // Redirect to login immediately
      navigate(redirectTo, { replace: true });
    };

    // Set logged in flag when component mounts with user
    if (auth.currentUser) {
      localStorage.setItem('wasLoggedIn', 'true');
    }

    return () => {
      unsubscribe();
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, [navigate, redirectTo, showToast, sessionExpired]);

  // Update logged in flag when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('wasLoggedIn', 'true');
    }
  }, [user]);

  return {
    user,
    loading,
    sessionExpired,
    isAuthenticated: !!user && !sessionExpired
  };
}
