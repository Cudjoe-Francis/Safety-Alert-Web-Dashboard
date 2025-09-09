import { Component, type ErrorInfo, type ReactNode } from 'react';
import { auth } from '../services/firebase';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error caught by boundary:', error, errorInfo);
    
    // Check if it's a Firebase permission error
    if (error.message.includes('Missing or insufficient permissions') || 
        error.message.includes('permission-denied')) {
      console.log('🔐 Firebase permission error detected - checking auth state');
      
      // Check if user is still authenticated
      if (!auth.currentUser) {
        console.log('🚪 No authenticated user - redirecting to sign in');
        window.location.href = '/signin';
      } else {
        // Try to refresh the token
        auth.currentUser.getIdToken(true).catch(() => {
          console.log('🚪 Token refresh failed - redirecting to sign in');
          auth.signOut();
          window.location.href = '/signin';
        });
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {this.state.error?.message.includes('permission') 
              ? 'Your session has expired. Please sign in again.'
              : 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#121a68',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
