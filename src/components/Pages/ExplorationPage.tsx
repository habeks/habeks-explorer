import React, { useState, useEffect } from 'react';
import { Player, Currency, Location, GameItem } from '../../types';
import { 
  RadarIcon, 
  SearchIcon, 
  CompassIcon, 
  TargetIcon,
  LightningIcon,
  CrystalIcon
} from '../Icons';
import { geolocationService } from '../../services/geolocation';
import { calculateDistance } from '../../utils/h3Utils';

interface ExplorationPageProps {
  player: Player | null;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  location: Location | null;
  setNotification: (message: string) => void;
}

export const ExplorationPage: React.FC<ExplorationPageProps> = ({
  player,
  currency,
  setCurrency,
  location,
  setNotification
}) => {
  const [scanRadius, setScanRadius] = useState(50); // метры
  const [isScanning, setIsScanning] = useState(false);
  const [foundItems, setFoundItems] = useState<GameItem[]>([]);
  const [scanCooldown, setScanCooldown] = useState(0);
  const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low'>('medium');
  const [compassHeading, setCompassHeading] = useState(0);

  // Обновление точности местоположения
  useEffect(() => {
    if (location) {
      setAccuracy(geolocationService.getAccuracyLevel(location.accuracy));
    }
  }, [location]);

  // Обновление компаса (имитация)
  useEffect(() => {
    const updateCompass = () => {
      setCompassHeading(prev => (prev + Math.random() * 10 - 5) % 360);
    };
    
    const interval = setInterval(updateCompass, 1000);
    return () => clearInterval(interval);
  }, []);

  // Обратный отсчет cooldown
  useEffect(() => {
    if (scanCooldown > 0) {
      const timer = setTimeout(() => setScanCooldown(scanCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [scanCooldown]);

  // Сканирование окрестностей
  const handleScan = async () => {
    if (!location) {
      setNotification('Местоположение не определено');
      return;
    }

    if (scanCooldown > 0) {
      setNotification(`Подождите ${scanCooldown} секунд`);
      return;
    }

    if (currency.tokens < 10) {
      setNotification('Недостаточно токенов для сканирования (10 токенов)');
      return;
    }

    setIsScanning(true);
    setScanCooldown(30); // 30 секунд cooldown

    try {
      // Имитация сканирования
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Генерация найденных предметов
      const newItems = generateRandomItems(location, scanRadius);
      setFoundItems(prev => [...prev, ...newItems]);
      
      // Списание токенов
      setCurrency({
        ...currency,
        tokens: currency.tokens - 10
      });
      
      if (newItems.length > 0) {
        setNotification(`Найдено ${newItems.length} предметов в радиусе ${scanRadius}м`);
      } else {
        setNotification('Предметы не обнаружены');
      }
    } catch (error) {
      setNotification('Ошибка сканирования');
    } finally {
      setIsScanning(false);
    }
  };

  // Генерация случайных предметов
  const generateRandomItems = (centerLocation: Location, radius: number): GameItem[] => {
    const items: GameItem[] = [];
    const itemCount = Math.floor(Math.random() * 5) + 1; // 1-5 предметов
    
    const itemTypes = ['weapon', 'armor', 'artifact', 'resource', 'consumable'] as const;
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
    const rarityWeights = [50, 30, 15, 4, 1]; // Веса для редкости
    
    for (let i = 0; i < itemCount; i++) {
      // Случайные координаты в радиусе
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;
      const deltaLat = (distance * Math.cos(angle)) / 111000; // Приблизительное преобразование
      const deltaLng = (distance * Math.sin(angle)) / (111000 * Math.cos(centerLocation.latitude * Math.PI / 180));
      
      // Выбор редкости по весу
      const random = Math.random() * 100;
      let rarity: typeof rarities[number] = 'common';
      let cumulativeWeight = 0;
      
      for (let j = 0; j < rarityWeights.length; j++) {
        cumulativeWeight += rarityWeights[j];
        if (random <= cumulativeWeight) {
          rarity = rarities[j];
          break;
        }
      }
      
      const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      const captureTime = rarity === 'legendary' ? 9 : 
                         rarity === 'epic' ? 7 :
                         rarity === 'rare' ? 5 :
                         rarity === 'uncommon' ? 4 : 3;
      
      items.push({
        id: `item_${Date.now()}_${i}`,
        type,
        name: generateItemName(type, rarity),
        rarity,
        description: generateItemDescription(type, rarity),
        icon: getItemIcon(type),
        value: calculateItemValue(rarity),
        coordinates: [
          centerLocation.latitude + deltaLat,
          centerLocation.longitude + deltaLng
        ],
        captureTime
      });
    }
    
    return items;
  };

  // Генерация названий предметов
  const generateItemName = (type: GameItem['type'], rarity: GameItem['rarity']): string => {
    const prefixes = {
      common: ['Обычный', 'Простой', 'Базовый'],
      uncommon: ['Необычный', 'Модифицированный', 'Улучшенный'],
      rare: ['Редкий', 'Кибер', 'Элитный'],
      epic: ['Эпический', 'Квантовый', 'Плазменный'],
      legendary: ['Легендарный', 'Мифический', 'Нанотех']
    };
    
    const names = {
      weapon: ['Меч', 'Плазменный клинок', 'Лазерная винтовка', 'Квантовый пистолет'],
      armor: ['Броня', 'Кибер-костюм', 'Щитовой генератор', 'Нано-пластины'],
      artifact: ['Кристалл', 'Руна', 'Матрица данных', 'Квантовый чип'],
      resource: ['Металл', 'Энергокристалл', 'Наноматериал', 'Плазма'],
      consumable: ['Стимпак', 'Энергобатарея', 'Наноботы', 'Бустер']
    };
    
    const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];
    const name = names[type][Math.floor(Math.random() * names[type].length)];
    
    return `${prefix} ${name}`;
  };

  // Генерация описаний
  const generateItemDescription = (type: GameItem['type'], rarity: GameItem['rarity']): string => {
    const descriptions = {
      weapon: 'Мощное оружие для борьбы с врагами',
      armor: 'Надежная защита от вражеских атак',
      artifact: 'Мистический артефакт с неизвестными свойствами',
      resource: 'Ценный ресурс для крафта и улучшений',
      consumable: 'Полезный предмет для восстановления'
    };
    
    return descriptions[type];
  };

  // Получение иконки предмета
  const getItemIcon = (type: GameItem['type']): string => {
    const icons = {
      weapon: '⚔️',
      armor: '🛡️',
      artifact: '🔮',
      resource: '💎',
      consumable: '💊'
    };
    return icons[type];
  };

  // Расчет стоимости предмета
  const calculateItemValue = (rarity: GameItem['rarity']): number => {
    const values = {
      common: 50,
      uncommon: 150,
      rare: 500,
      epic: 1500,
      legendary: 5000
    };
    return values[rarity] + Math.floor(Math.random() * values[rarity] * 0.5);
  };

  // Переход к AR сбору предмета
  const handleCollectItem = (item: GameItem) => {
    // Имитация перехода к AR
    setNotification(`Перейдите на вкладку "AR Сбор" чтобы собрать ${item.name}`);
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Шапка */}
      <div className="glass-panel m-4 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <RadarIcon size={24} className="text-neon-green" />
            <h2 className="font-heading text-xl text-neon-green">
              Исследование окрестностей
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Компас */}
            <div className="text-center">
              <div style={{ transform: `rotate(${compassHeading}deg)` }}>
                <CompassIcon 
                  size={32} 
                  className="text-neon-blue"
                />
              </div>
              <p className="text-xs text-text-muted">{Math.round(compassHeading)}°</p>
            </div>
            
            {/* Точность GPS */}
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                accuracy === 'high' ? 'bg-neon-green' :
                accuracy === 'medium' ? 'bg-neon-yellow' :
                'bg-neon-pink'
              }`}></div>
              <p className="text-xs text-text-muted capitalize">{accuracy}</p>
            </div>
          </div>
        </div>

        {/* Настройки сканирования */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Радиус сканирования: {scanRadius}м
            </label>
            <input
              type="range"
              min="25"
              max="100"
              step="5"
              value={scanRadius}
              onChange={(e) => setScanRadius(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="flex items-end">
            <button
              className={`btn-neon green w-full ${
                isScanning || scanCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleScan}
              disabled={isScanning || scanCooldown > 0}
            >
              {isScanning ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner w-4 h-4"></div>
                  <span>Сканирование...</span>
                </div>
              ) : scanCooldown > 0 ? (
                `Ожидание ${scanCooldown}с`
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <SearchIcon size={16} />
                  <span>Сканировать (10 токенов)</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Основная область - карта */}
      <div className="flex-1 relative">
        <div className="w-full h-full bg-bg-secondary cyber-grid relative overflow-hidden">
          {/* Простое отображение карты */}
          <div className="absolute inset-0 flex items-center justify-center">
            {location ? (
              <div className="relative">
                {/* Центр (текущее местоположение) */}
                <div className="w-8 h-8 bg-neon-blue rounded-full border-2 border-white animate-pulse"></div>
                
                {/* Радиус сканирования */}
                <div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-neon-green border-opacity-50 rounded-full"
                  style={{
                    width: `${scanRadius * 4}px`,
                    height: `${scanRadius * 4}px`
                  }}
                ></div>
                
                {/* Найденные предметы */}
                {foundItems.map((item, index) => {
                  const angle = (index * 45) % 360;
                  const distance = 20 + (index % 3) * 15;
                  const x = Math.cos(angle * Math.PI / 180) * distance;
                  const y = Math.sin(angle * Math.PI / 180) * distance;
                  
                  return (
                    <div
                      key={item.id}
                      className={`absolute w-6 h-6 rounded-full border-2 cursor-pointer transition-all hover:scale-125 ${
                        item.rarity === 'legendary' ? 'bg-neon-orange border-neon-orange glow-pulse' :
                        item.rarity === 'epic' ? 'bg-neon-purple border-neon-purple' :
                        item.rarity === 'rare' ? 'bg-neon-blue border-neon-blue' :
                        item.rarity === 'uncommon' ? 'bg-neon-green border-neon-green' :
                        'bg-gray-400 border-gray-400'
                      }`}
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => handleCollectItem(item)}
                      title={item.name}
                    >
                      <div className="w-full h-full flex items-center justify-center text-xs">
                        {item.icon}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center">
                <CompassIcon size={48} className="text-neon-blue opacity-50 mb-4" />
                <p className="text-text-muted">Определение местоположения...</p>
              </div>
            )}
          </div>
          
          {/* Легенда редкости */}
          <div className="absolute top-4 right-4 glass-panel p-3">
            <h4 className="font-heading text-sm mb-2 text-neon-purple">Редкость</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>Обычные</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-neon-green rounded-full"></div>
                <span>Необычные</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-neon-blue rounded-full"></div>
                <span>Редкие</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-neon-purple rounded-full"></div>
                <span>Эпические</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-neon-orange rounded-full"></div>
                <span>Легендарные</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Список найденных предметов */}
      {foundItems.length > 0 && (
        <div className="glass-panel m-4 p-4">
          <h3 className="font-heading text-lg mb-3 text-neon-green">
            Найденные предметы ({foundItems.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
            {foundItems.slice(-10).map((item) => (
              <div
                key={item.id}
                className={`cyber-card p-3 cursor-pointer transition-all hover:scale-105 rarity-${item.rarity}`}
                onClick={() => handleCollectItem(item)}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{item.icon}</div>
                  
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      item.rarity === 'legendary' ? 'text-neon-orange' :
                      item.rarity === 'epic' ? 'text-neon-purple' :
                      item.rarity === 'rare' ? 'text-neon-blue' :
                      item.rarity === 'uncommon' ? 'text-neon-green' :
                      'text-gray-400'
                    }`}>
                      {item.name}
                    </h4>
                    <p className="text-xs text-text-muted">
                      {item.description}
                    </p>
                    <p className="text-xs text-neon-yellow mt-1">
                      Сбор: {item.captureTime}с | Цена: {item.value}
                    </p>
                  </div>
                  
                  <TargetIcon size={20} className="text-neon-blue" />
                </div>
              </div>
            ))}
          </div>
          
          {foundItems.length > 10 && (
            <p className="text-xs text-text-muted text-center mt-2">
              Показано последние 10 предметов
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorationPage;