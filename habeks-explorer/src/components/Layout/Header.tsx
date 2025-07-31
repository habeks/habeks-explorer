import React, { useState } from 'react';
import { Player, Currency } from '../../types';
import { 
  UserIcon, 
  WalletIcon, 
  BellIcon, 
  SettingsIcon, 
  MenuIcon,
  CrystalIcon,
  LightningIcon 
} from '../Icons';

interface HeaderProps {
  player: Player | null;
  currency: Currency;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ player, currency, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  return (
    <header className="glass-panel m-4 p-4">
      <div className="flex justify-between items-center">
        {/* Лого и название */}
        <div className="flex items-center space-x-3">
          <button 
            className="btn-neon p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MenuIcon size={20} />
          </button>
          <div>
            <h1 className="font-heading text-2xl text-neon-blue">
              HABEKS EXPLORER
            </h1>
            <p className="text-sm text-text-secondary">
              CYBERPUNK AR GAME
            </p>
          </div>
        </div>

        {/* Информация о игроке */}
        <div className="flex items-center space-x-4">
          {/* Краткая информация о валюте */}
          <button 
            className="btn-neon purple flex items-center space-x-2"
            onClick={() => setIsWalletOpen(!isWalletOpen)}
          >
            <CrystalIcon size={16} />
            <span className="font-mono">{currency.tokens.toLocaleString()}</span>
          </button>

          {/* Уведомления */}
          <button className="btn-neon p-2">
            <BellIcon size={20} />
          </button>

          {/* Профиль игрока */}
          <div className="flex items-center space-x-2">
            <UserIcon size={20} className="text-neon-green" />
            <div className="text-right">
              <p className="text-sm font-semibold text-neon-green">
                {player?.nickname || 'Гость'}
              </p>
              <p className="text-xs text-text-muted">
                Уровень {player?.level || 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Выпадающее меню */}
      {isMenuOpen && (
        <div className="absolute top-20 left-4 glass-panel p-4 z-50 min-w-64">
          <nav className="space-y-2">
            <button className="w-full text-left p-2 rounded hover:bg-bg-tertiary transition-colors">
              <div className="flex items-center space-x-2">
                <SettingsIcon size={16} />
                <span>Настройки</span>
              </div>
            </button>
            
            <button className="w-full text-left p-2 rounded hover:bg-bg-tertiary transition-colors">
              <div className="flex items-center space-x-2">
                <UserIcon size={16} />
                <span>Профиль</span>
              </div>
            </button>
            
            <hr className="border-border-glass" />
            
            <button 
              className="w-full text-left p-2 rounded hover:bg-neon-pink hover:text-bg-primary transition-colors text-neon-pink"
              onClick={onLogout}
            >
              Выйти
            </button>
          </nav>
        </div>
      )}

      {/* Подробное окно валюты */}
      {isWalletOpen && (
        <div className="absolute top-20 right-4 glass-panel p-4 z-50 min-w-80">
          <h3 className="font-heading text-lg mb-4 text-neon-purple">
            Валюты и ресурсы
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Основная валюта */}
            <div className="cyber-card p-3">
              <div className="flex items-center space-x-2">
                <CrystalIcon size={20} className="text-neon-blue" />
                <div>
                  <p className="text-sm text-text-secondary">Токены</p>
                  <p className="font-mono font-bold text-neon-blue">
                    {currency.tokens.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Осколки */}
            <div className="cyber-card p-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-neon-green rounded opacity-75" />
                <div>
                  <p className="text-sm text-text-secondary">Осколки</p>
                  <p className="font-mono font-bold text-neon-green">
                    {currency.shards.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Орбы */}
            <div className="cyber-card p-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-neon-purple rounded-full" />
                <div>
                  <p className="text-sm text-text-secondary">Орбы</p>
                  <p className="font-mono font-bold text-neon-purple">
                    {currency.orbs.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Энергия */}
            <div className="cyber-card p-3">
              <div className="flex items-center space-x-2">
                <LightningIcon size={20} className="text-neon-yellow" />
                <div>
                  <p className="text-sm text-text-secondary">Нефть</p>
                  <p className="font-mono font-bold text-neon-yellow">
                    {currency.oil.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Газ */}
            <div className="cyber-card p-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-neon-cyan rounded" />
                <div>
                  <p className="text-sm text-text-secondary">Газ</p>
                  <p className="font-mono font-bold text-neon-cyan">
                    {currency.gas.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Золото */}
            <div className="cyber-card p-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-yellow-400 rounded-full" />
                <div>
                  <p className="text-sm text-text-secondary">Золото</p>
                  <p className="font-mono font-bold text-yellow-400">
                    {currency.gold.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;