import React, { createContext, useContext, useState, type ReactNode } from 'react';
import Toast from '../components/Toast';

interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: 'info' | 'warning' | 'error' | 'success', duration?: number) => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'info' | 'warning' | 'error' | 'success', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
      <div className="toast-container" style={{ 
        position: 'fixed', 
        top: '20px', 
        left: '20px', 
        right: '20px',
        zIndex: 10000,
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            style={{ 
              pointerEvents: 'auto',
              width: '100%'
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export { ToastProvider };

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
