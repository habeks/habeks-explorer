import React, { useEffect, useState } from 'react';
import { BellIcon } from '../Icons';

interface NotificationToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  message,
  type = 'info',
  duration = 4000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  const typeStyles = {
    info: 'border-neon-blue text-neon-blue',
    success: 'border-neon-green text-neon-green',
    warning: 'border-neon-yellow text-neon-yellow',
    error: 'border-neon-pink text-neon-pink'
  };

  const typeIcons = {
    info: BellIcon,
    success: BellIcon,
    warning: BellIcon,
    error: BellIcon
  };

  useEffect(() => {
    // Появление с анимацией
    setIsVisible(true);

    // Прогресс бар
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 50));
        return newProgress > 0 ? newProgress : 0;
      });
    }, 50);

    // Автоматическое скрытие
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Ждем завершения анимации
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  const IconComponent = typeIcons[type];

  return (
    <div 
      className={`fixed top-20 right-4 z-50 glass-panel border-2 min-w-80 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${typeStyles[type]}`}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <IconComponent size={20} className="mt-1" />
          
          <div className="flex-1">
            <p className="text-sm font-medium">
              {message}
            </p>
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-text-muted hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Прогресс бар */}
      <div className="h-1 bg-bg-tertiary">
        <div 
          className={`h-full transition-all duration-100 ease-linear ${
            type === 'info' ? 'bg-neon-blue' :
            type === 'success' ? 'bg-neon-green' :
            type === 'warning' ? 'bg-neon-yellow' :
            'bg-neon-pink'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default NotificationToast;