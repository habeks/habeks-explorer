import React, { useState, useEffect } from 'react';
import { Player } from '../../types';
import { UserIcon, LightningIcon, HexagonIcon } from '../Icons';
import { GOOGLE_CLIENT_ID, GoogleCredentialResponse, decodeGoogleCredential } from '../../config/auth';

interface AuthModalProps {
  onAuthSuccess: (player: Player) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    termsAccepted: false
  });
  const [error, setError] = useState('');

  // Google OAuth обработчик
  const handleGoogleCredentialResponse = (response: GoogleCredentialResponse) => {
    try {
      const googleUser = decodeGoogleCredential(response.credential);
      
      const player: Player = {
        id: googleUser.sub,
        nickname: googleUser.name || googleUser.given_name || 'Habeks Player',
        email: googleUser.email,
        level: 1,
        experience: 0,
        createdAt: new Date()
      };
      
      console.log('✅ Google OAuth успешно:', player);
      onAuthSuccess(player);
    } catch (err) {
      console.error('❌ Ошибка обработки Google OAuth:', err);
      setError('Ошибка аутентификации через Google');
    }
  };

  // Инициализация Google OAuth
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: false
      });
    }
  }, []);

  // Запуск Google OAuth
  const handleGoogleAuth = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google Services не загружены. Попробуйте обновить страницу.');
    }
  };

  // Обычная регистрация/вход
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!isLogin && !formData.termsAccepted) {
      setError('Необходимо принять правила пользования');
      setIsLoading(false);
      return;
    }
    
    try {
      // Имитация API запроса
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockPlayer: Player = {
        id: `player_${Date.now()}`,
        nickname: formData.nickname || 'Новый исследователь',
        email: formData.email,
        level: 1,
        experience: 0,
        createdAt: new Date()
      };
      
      onAuthSuccess(mockPlayer);
    } catch (err) {
      setError('Ошибка аутентификации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="glass-panel-lg p-8 max-w-md w-full m-4">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <HexagonIcon size={60} className="text-neon-blue glow-pulse" />
            <LightningIcon size={30} className="text-neon-yellow ml-2" />
          </div>
          
          <h2 className="font-heading text-2xl text-neon-blue mb-2">
            HABEKS EXPLORER
          </h2>
          
          <p className="text-text-secondary">
            Войдите в кибер-мир
          </p>
        </div>

        {/* Google OAuth кнопка */}
        <button
          className="btn-neon w-full mb-6 flex items-center justify-center space-x-3"
          onClick={handleGoogleAuth}
          disabled={isLoading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" className="text-white">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Войти через Google</span>
        </button>

        {/* Разделитель */}
        <div className="flex items-center mb-6">
          <div className="flex-1 h-px bg-border-glass"></div>
          <span className="px-4 text-text-muted text-sm">или</span>
          <div className="flex-1 h-px bg-border-glass"></div>
        </div>

        {/* Форма регистрации/входа */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-3 bg-bg-secondary border border-border-glass rounded text-white focus:border-neon-blue transition-colors"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Никнейм (только для регистрации) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Никнейм
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                className="w-full p-3 bg-bg-secondary border border-border-glass rounded text-white focus:border-neon-blue transition-colors"
                placeholder="Ваш никнейм"
                required
              />
            </div>
          )}

          {/* Правила (только для регистрации) */}
          {!isLogin && (
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={formData.termsAccepted}
                onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                className="mt-1"
                required
              />
              <label htmlFor="terms" className="text-sm text-text-secondary">
                Я принимаю{' '}
                <a href="#" className="text-neon-blue hover:underline">
                  правила пользования
                </a>{' '}
                и{' '}
                <a href="#" className="text-neon-blue hover:underline">
                  политику конфиденциальности
                </a>
              </label>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="p-3 bg-neon-pink bg-opacity-20 border border-neon-pink rounded text-neon-pink text-sm">
              {error}
            </div>
          )}

          {/* Кнопка отправки */}
          <button
            type="submit"
            className="btn-neon green w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="spinner w-5 h-5"></div>
                <span>Обработка...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <UserIcon size={20} />
                <span>{isLogin ? 'Войти' : 'Зарегистрироваться'}</span>
              </div>
            )}
          </button>
        </form>

        {/* Переключение режима */}
        <div className="text-center mt-6">
          <p className="text-text-secondary text-sm">
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
            {' '}
            <button
              type="button"
              className="text-neon-blue hover:underline"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 text-center">
          <p className="text-text-muted text-xs">
            Приложение использует вашу геолокацию и камеру<br/>
            для обеспечения AR функциональности
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;