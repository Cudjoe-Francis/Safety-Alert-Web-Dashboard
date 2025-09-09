// Toast notification component for session expiry and other notifications
import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = {
      position: 'relative' as const,
      padding: '16px 20px',
      borderRadius: '12px',
      color: 'white',
      fontWeight: '500',
      fontSize: '15px',
      minWidth: '300px',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: isVisible ? 'translateX(0) scale(1)' : 'translateX(-100%) scale(0.95)',
      opacity: isVisible ? 1 : 0,
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    };

    const typeStyles = {
      info: { backgroundColor: '#3b82f6' },
      warning: { backgroundColor: '#f59e0b' },
      error: { backgroundColor: '#ef4444' },
      success: { backgroundColor: '#10b981' },
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  const getIcon = () => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return '';
    }
  };

  return (
    <div 
      style={getToastStyles()}
      className="toast-responsive"
    >
      <span style={{ flex: 1, wordBreak: 'break-word', display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '8px' }}>{getIcon()}</span>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0',
          marginLeft: '12px',
          flexShrink: 0,
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
