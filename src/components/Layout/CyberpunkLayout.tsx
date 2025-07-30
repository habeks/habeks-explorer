import React, { useState, useEffect } from 'react';
import { AppTab, Player, Currency, Location } from '../../types';
import { OwnershipMap } from '../Pages/OwnershipMap';
import { ExplorationPage } from '../Pages/ExplorationPage';
import { ARCollectionPage } from '../Pages/ARCollectionPage';
import { AuthModal } from '../Auth/AuthModal';
import { LoadingScreen } from '../UI/LoadingScreen';
import { NotificationToast } from '../UI/NotificationToast';
import removeBanners from '../../utils/removeBanners';
import applyOrientationFix from '../../utils/orientationFix';

// КИБЕРПАНК ИКОНКИ
const HexagonIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const ScanIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 7V5C3 3.9 3.9 3 5 3H7M17 3H19C20.1 3 21 3.9 21 5V7M21 17V19C21 20.1 20.1 21 19 21H17M7 21H5C3.9 21 3 20.1 3 19V17M12 8L8 12L12 16L16 12L12 8Z" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const CameraIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 9C10.3 9 9 10.3 9 12S10.3 15 12 15 15 13.7 15 12 13.7 9 12 9ZM20 4H16.8L15 2H9L7.2 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

export const CyberpunkLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppTab['id']>('ownership');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currency, setCurrency] = useState<Currency>({
    tokens: 1250,
    shards: 50,
    orbs: 0,
    oil: 0,
    gas: 0,
    gold: 0,
    silver: 0,
    stone: 0,
    wood: 0
  });
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Инициализация приложения
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Применить фиксы для мобильных устройств
        removeBanners();
        applyOrientationFix();

        // Проверка сохраненной аутентификации
        const savedAuth = localStorage.getItem('habeks_auth');
        if (savedAuth) {
          const authData = JSON.parse(savedAuth);
          setPlayer(authData.player);
          setCurrency(authData.currency || currency);
          setIsAuthenticated(true);
        }

        // Получение геолокации
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: Date.now()
              });
              console.log('✅ Геолокация получена:', position.coords);
            },
            (error) => {
              console.warn('⚠️ Геолокация недоступна:', error);
              // Fallback к Москве
              setLocation({
                latitude: 55.7558,
                longitude: 37.6173,
                accuracy: 1000,
                timestamp: Date.now()
              });
            }
          );
        }

        // Регистрация Service Worker для PWA
        if ('serviceWorker' in navigator) {
          try {
            const swPath = window.location.hostname === 'localhost' ? '/sw.js' : '/habeks-explorer/sw.js';
            await navigator.serviceWorker.register(swPath);
            console.log('✅ Service Worker зарегистрирован');
          } catch (error) {
            console.error('❌ Ошибка регистрации Service Worker:', error);
          }
        }

        // Демо-аутентификация для тестирования (если нет сохраненной)
        if (!localStorage.getItem('habeks_auth')) {
          const demoPlayer: Player = {
            id: 'demo_player_123',
            nickname: 'CyberExplorer',
            email: 'demo@habeks.explorer',
            level: 5,
            experience: 2500,
            createdAt: new Date()
          };
          
          const demoAuth = {
            player: demoPlayer,
            currency: currency
          };
          
          localStorage.setItem('habeks_auth', JSON.stringify(demoAuth));
          setPlayer(demoPlayer);
          setIsAuthenticated(true);
          console.log('🎮 Демо-режим активирован для тестирования');
        }
        
      } catch (error) {
        console.error('❌ Ошибка инициализации приложения:', error);
        setNotification('Ошибка инициализации приложения');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Обработчик аутентификации
  const handleAuthentication = (playerData: Player, currencyData?: Currency) => {
    setPlayer(playerData);
    setIsAuthenticated(true);
    if (currencyData) {
      setCurrency(currencyData);
    }
    
    // Сохранение в localStorage
    const authData = { 
      player: playerData, 
      currency: currencyData || currency 
    };
    localStorage.setItem('habeks_auth', JSON.stringify(authData));
  };

  // Показать загрузочный экран
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Показать модал аутентификации
  if (!isAuthenticated) {
    return (
      <AuthModal
        onAuthSuccess={(playerData) => handleAuthentication(playerData)}
      />
    );
  }

  // Рендеринг текущего контента
  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'ownership':
        return (
          <OwnershipMap
            player={player}
            currency={currency}
            setCurrency={setCurrency}
            location={location}
            setNotification={setNotification}
          />
        );
      case 'exploration':
        return (
          <ExplorationPage
            player={player}
            currency={currency}
            setCurrency={setCurrency}
            location={location}
            setNotification={setNotification}
          />
        );
      case 'ar-collection':
        return (
          <ARCollectionPage
            player={player}
            currency={currency}
            setCurrency={setCurrency}
            location={location}
            setNotification={setNotification}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      {/* ПОЛНОЭКРАННАЯ КАРТА КАК ОСНОВА */}
      <div className="fullscreen-map-container">
        {renderCurrentPage()}
      </div>

      {/* OVERLAY UI ПОВЕРХ КАРТЫ */}
      <div className="overlay-ui">
        {/* ВЕРХНИЙ HUD - Профиль игрока и валюта */}
        <div className="cyberpunk-hud" style={{
          top: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Профиль */}
          <div className="flex items-center space-x-4">
            <div className="cyberpunk-hexagon w-12 h-12 flex items-center justify-center">
              <span className="text-sm font-bold">{player?.level || 1}</span>
            </div>
            <div>
              <div className="text-sm text-neon-blue font-mono">{player?.nickname}</div>
              <div className="text-xs text-text-secondary">{player?.experience} XP</div>
            </div>
          </div>
          
          {/* Валюта */}
          <div className="flex space-x-4">
            <div className="skill-points-display px-3 py-2">
              <span className="text-neon-green font-mono">{currency.tokens}</span>
              <span className="text-xs ml-1">ТОКЕНОВ</span>
            </div>
            <div className="skill-points-display px-3 py-2">
              <span className="text-neon-purple font-mono">{currency.shards}</span>
              <span className="text-xs ml-1">ОСКОЛКОВ</span>
            </div>
          </div>
        </div>

        {/* НИЖНЯЯ НАВИГАЦИЯ - Табы */}
        <div className="cyberpunk-hud" style={{
          bottom: '20px',
          left: '20px',
          right: '20px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div className="flex space-x-2">
            <button
              className={`cyberpunk-button flex items-center space-x-2 ${
                currentTab === 'ownership' ? 'bg-opacity-60' : ''
              }`}
              onClick={() => setCurrentTab('ownership')}
            >
              <HexagonIcon />
              <span>ВЛАДЕНИЯ</span>
            </button>
            
            <button
              className={`cyberpunk-button flex items-center space-x-2 ${
                currentTab === 'exploration' ? 'bg-opacity-60' : ''
              }`}
              onClick={() => setCurrentTab('exploration')}
            >
              <ScanIcon />
              <span>ИССЛЕДОВАНИЕ</span>
            </button>
            
            <button
              className={`cyberpunk-button flex items-center space-x-2 ${
                currentTab === 'ar-collection' ? 'bg-opacity-60' : ''
              }`}
              onClick={() => setCurrentTab('ar-collection')}
            >
              <CameraIcon />
              <span>AR СБОР</span>
            </button>
          </div>
        </div>
      </div>

      {/* Уведомления */}
      {notification && (
        <NotificationToast
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default CyberpunkLayout;