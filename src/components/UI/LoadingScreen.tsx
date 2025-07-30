import React, { useEffect, useState } from 'react';
import { HexagonIcon, LightningIcon } from '../Icons';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Инициализация кибер-пространства...' 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const loadingSteps = [
    'Подключение к сети...',
    'Инициализация AR системы...',
    'Загрузка гексагональной сетки...',
    'Получение геолокации...',
    'Синхронизация данных...',
    'Готово к запуску!'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        // Обновление текущего шага
        const step = Math.floor(newProgress / (100 / loadingSteps.length));
        if (step !== currentStep && step < loadingSteps.length) {
          setCurrentStep(step);
        }
        
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentStep, loadingSteps.length]);

  return (
    <div className="h-screen w-full bg-bg-primary flex flex-col items-center justify-center cyber-grid">
      {/* Лого и название */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <HexagonIcon size={80} className="text-neon-blue glow-pulse" />
          <LightningIcon size={40} className="text-neon-yellow ml-4" />
        </div>
        
        <h1 className="font-heading text-4xl text-neon-blue mb-2">
          HABEKS EXPLORER
        </h1>
        
        <p className="text-lg text-text-secondary">
          CYBERPUNK AR GAME
        </p>
        
        <div className="mt-4 text-neon-purple font-mono text-sm">
          v1.0.0 | BETA BUILD
        </div>
      </div>

      {/* Прогресс бар */}
      <div className="w-80 mb-8">
        <div className="progress-bar mb-4">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-text-muted font-mono">
          <span>0%</span>
          <span className="text-neon-blue">{Math.round(progress)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Текущий статус */}
      <div className="text-center">
        <p className="text-neon-green text-lg mb-2">
          {loadingSteps[currentStep] || message}
        </p>
        
        {/* Анимированные точки */}
        <div className="flex justify-center space-x-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className="pulse-dot"
              style={{ 
                animationDelay: `${i * 0.3}s` 
              }}
            />
          ))}
        </div>
      </div>

      {/* Дополнительная информация */}
      <div className="absolute bottom-8 text-center">
        <p className="text-text-muted text-sm mb-2">
          Поддерживаемые технологии:
        </p>
        
        <div className="flex justify-center space-x-6 text-xs text-text-secondary">
          <span className="text-neon-blue">PWA</span>
          <span className="text-neon-green">WebGL</span>
          <span className="text-neon-purple">Geolocation</span>
          <span className="text-neon-cyan">Camera API</span>
          <span className="text-neon-yellow">H3 Hexagons</span>
        </div>
      </div>

      {/* Фоновые эффекты */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Плавающие гексагоны */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s'
            }}
          >
            <HexagonIcon
              size={40}
              className="text-neon-blue opacity-20 animate-pulse"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;