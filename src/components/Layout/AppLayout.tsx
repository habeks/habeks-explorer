import React, { useState, useEffect } from 'react';
import { AppTab, Player, Currency, Location } from '../../types';
import TabNavigation from './TabNavigation';
import Header from './Header';
import { OwnershipMap } from '../Pages/OwnershipMap';
import { ExplorationPage } from '../Pages/ExplorationPage';
import { ARCollectionPage } from '../Pages/ARCollectionPage';
import { AuthModal } from '../Auth/AuthModal';
import { LoadingScreen } from '../UI/LoadingScreen';
import { NotificationToast } from '../UI/NotificationToast';
import removeBanners from '../../utils/removeBanners';
import applyOrientationFix from '../../utils/orientationFix';

export const AppLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppTab['id']>('ownership');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currency, setCurrency] = useState<Currency>({
    tokens: 0,
    shards: 0,
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
            },
            (error) => {
              console.error('Ошибка получения геолокации:', error);
              setNotification('Не удалось получить ваше местоположение');
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          );
        }

        // Регистрация Service Worker для PWA
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js');
            console.log('Service Worker зарегистрирован');
          } catch (error) {
            console.error('Ошибка регистрации Service Worker:', error);
          }
        }

        // Демо-аутентификация для тестирования (если нет сохраненной)
        if (!localStorage.getItem('habeks_auth')) {
          const demoPlayer: Player = {
            id: 'demo_player_123',
            nickname: 'Демо Исследователь',
            email: 'demo@habeks.explorer',
            level: 5,
            experience: 2500,
            createdAt: new Date()
          };
          
          const demoCurrency: Currency = {
            tokens: 5000,
            shards: 500,
            orbs: 50,
            oil: 200,
            gas: 100,
            gold: 25,
            silver: 80,
            stone: 300,
            wood: 450
          };
          
          setPlayer(demoPlayer);
          setCurrency(demoCurrency);
          setIsAuthenticated(true);
          
          localStorage.setItem('habeks_auth', JSON.stringify({
            player: demoPlayer,
            currency: demoCurrency
          }));
          
          console.log('🎮 Демо-режим активирован для тестирования');
        }

      } catch (error) {
        console.error('Ошибка инициализации:', error);
        setNotification('Ошибка загрузки приложения');
      } finally {
        // Имитация загрузки
        setTimeout(() => setIsLoading(false), 1500);
      }
    };

    initializeApp();
    
    // Удаление всех баннеров MiniMax
    const cleanupBanners = removeBanners();
    
    // Исправление ориентации для мобильных устройств
    const cleanupOrientation = applyOrientationFix();
    
    // Очистка при размонтировании компонента
    return () => {
      cleanupBanners();
      cleanupOrientation();
    };
  }, []);

  // Обработка успешной аутентификации
  const handleAuthSuccess = (playerData: Player) => {
    setPlayer(playerData);
    setIsAuthenticated(true);
    
    // Начальная валюта для новых игроков
    const initialCurrency: Currency = {
      tokens: 1000,
      shards: 100,
      orbs: 10,
      oil: 50,
      gas: 25,
      gold: 5,
      silver: 20,
      stone: 100,
      wood: 150
    };
    
    setCurrency(initialCurrency);

    // Сохранение в localStorage
    localStorage.setItem('habeks_auth', JSON.stringify({
      player: playerData,
      currency: initialCurrency
    }));

    setNotification(`Добро пожаловать, ${playerData.nickname}!`);
  };

  // Выход из системы
  const handleLogout = () => {
    setPlayer(null);
    setIsAuthenticated(false);
    setCurrency({
      tokens: 0,
      shards: 0,
      orbs: 0,
      oil: 0,
      gas: 0,
      gold: 0,
      silver: 0,
      stone: 0,
      wood: 0
    });
    localStorage.removeItem('habeks_auth');
    setNotification('Вы вышли из системы');
  };

  // Отображение соответствующей страницы
  const renderCurrentPage = () => {
    const pageProps = {
      player,
      currency,
      setCurrency,
      location,
      setNotification
    };

    switch (currentTab) {
      case 'ownership':
        return <OwnershipMap {...pageProps} />;
      case 'exploration':
        return <ExplorationPage {...pageProps} />;
      case 'ar-collection':
        return <ARCollectionPage {...pageProps} />;
      default:
        return <OwnershipMap {...pageProps} />;
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen w-full bg-primary text-text-primary overflow-hidden cyber-grid">
      {/* Модальное окно аутентификации */}
      {!isAuthenticated && (
        <AuthModal onAuthSuccess={handleAuthSuccess} />
      )}

      {/* Основное приложение */}
      {isAuthenticated && (
        <>
          {/* Шапка - скрыта для карты владений для полноэкранного эффекта */}
          {currentTab !== 'ownership' && (
            <Header 
              player={player}
              currency={currency}
              onLogout={handleLogout}
            />
          )}

          {/* Основной контент - ВСЕГДА полноэкранный для карты */}
          <main className={`${currentTab === 'ownership' ? 'absolute inset-0' : 'flex-1'} overflow-hidden relative`}>
            {renderCurrentPage()}
          </main>

          {/* Навигация по вкладкам - ВСЕГДА плавающая поверх карты */}
          <div className="fixed bottom-4 left-4 right-4 z-[100]">
            <TabNavigation 
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              isFloating={true}
            />
          </div>
        </>
      )}

      {/* Уведомления */}
      {notification && (
        <NotificationToast 
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}

      {/* CSS для скрытия любых внешних баннеров в нижнем правом углу */}
      <style>{`
        /* Скрываем любые элементы, которые могут быть внедрены в правый нижний угол */
        .minimax-banner, 
        [class*="minimax"], 
        [id*="minimax"],
        [data-minimax],
        [style*="position: fixed"][style*="bottom"][style*="right"],
        div[style*="position:fixed"][style*="bottom:"][style*="right:"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
};

export default AppLayout;