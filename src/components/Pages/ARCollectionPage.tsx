import React, { useState, useRef, useEffect } from 'react';
import { Player, Currency, Location, GameItem, ARCapture } from '../../types';
import { 
  CameraIcon, 
  TargetIcon, 
  CrosshairIcon, 
  BackpackIcon,
  LightningIcon,
  CrystalIcon
} from '../Icons';

interface ARCollectionPageProps {
  player: Player | null;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  location: Location | null;
  setNotification: (message: string) => void;
}

export const ARCollectionPage: React.FC<ARCollectionPageProps> = ({
  player,
  currency,
  setCurrency,
  location,
  setNotification
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [arObjects, setArObjects] = useState<GameItem[]>([]);
  const [activeCapture, setActiveCapture] = useState<ARCapture | null>(null);
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0, z: 0 });
  const [inventory, setInventory] = useState<GameItem[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [movementThreshold] = useState(0.5); // Порог движения
  const [loading, setLoading] = useState(false); // Статус загрузки камеры
  const [error, setError] = useState<string | null>(null); // Ошибка камеры

  // Инициализация камеры
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Отслеживание движения устройства
  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const { accelerationIncludingGravity } = event;
      if (accelerationIncludingGravity) {
        const { x = 0, y = 0, z = 0 } = accelerationIncludingGravity;
        setDeviceMotion({ x, y, z });
        
        // Проверка на движение
        const movement = Math.sqrt(x * x + y * y + z * z);
        const isCurrentlyMoving = movement > movementThreshold;
        
        if (isCurrentlyMoving !== isMoving) {
          setIsMoving(isCurrentlyMoving);
          
          // Сброс прогресса при движении
          if (isCurrentlyMoving && activeCapture) {
            setActiveCapture(null);
            setNotification('Сбор прерван - устройство движется');
          }
        }
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [isMoving, activeCapture, movementThreshold]);

  // УПРОЩЕННЫЙ запуск AR камеры - базовая логика
  const startCamera = async () => {
    setLoading(true);
    setError(null);
    
    console.log('📱 Начинаем запуск AR камеры...');
    
    // Простая проверка HTTPS для production
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      const errorMsg = '🔒 AR камера требует HTTPS. Откройте сайт через https://';
      setError(errorMsg);
      setNotification(errorMsg);
      setLoading(false);
      return;
    }
    
    try {
      setNotification('🚀 Инициализация AR-камеры...');
      
      // Простая проверка поддержки API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Камера не поддерживается в вашем браузере');
      }
      
      const video = videoRef.current;
      if (!video) {
        throw new Error('Ошибка: видео элемент не найден');
      }
      
      // Останавливаем предыдущий поток
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
        currentStreamRef.current = null;
      }
      
      // ПРОСТОЙ конфиг для максимальной совместимости
      const constraints = {
        video: {
          facingMode: 'environment', // Задняя камера
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };
      
      console.log('📷 Запрашиваем доступ к камере...');
      
      // Базовый вызов getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!stream) {
        throw new Error('Не удалось получить видеопоток');
      }
      
      currentStreamRef.current = stream;
      console.log('✅ Видеопоток получен успешно');
      
      // Настраиваем видео
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      
      // Простое ожидание загрузки и запуск
      video.onloadedmetadata = () => {
        video.play().then(() => {
          console.log('✅ Видео запущено');
          setIsCameraActive(true);
          generateARObjects();
          setNotification('✅ AR камера активна! Нажмите на объекты для сбора');
        }).catch(playError => {
          console.warn('⚠️ Нужно взаимодействие пользователя:', playError);
          setNotification('💆 Нажмите на экран для активации камеры');
          setIsCameraActive(true);
          generateARObjects();
        });
      };
      
    } catch (error) {
      console.error('❌ Ошибка запуска AR камеры:', error);
      
      let errorMsg = 'Ошибка камеры';
      
      if (error instanceof Error) {
        const msg = error.message;
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          errorMsg = '📵 Разрешите доступ к камере в настройках браузера';
        } else if (msg.includes('NotFound')) {
          errorMsg = '📷 Камера не обнаружена. Проверьте подключение';
        } else {
          errorMsg = `⚠️ ${msg}`;
        }
      }
      
      setError(errorMsg);
      setNotification(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Остановка камеры
  const stopCamera = () => {
    try {
      // Остановка всех треков видеопотока
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
        currentStreamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setIsCameraActive(false);
      setArObjects([]);
      setActiveCapture(null);
      setLoading(false);
      setError(null);
      console.log('AR камера остановлена');
    } catch (err) {
      console.error('Ошибка при остановке камеры:', err);
    }
  };

  // Генерация AR объектов
  const generateARObjects = () => {
    if (!location) return;

    const objects: GameItem[] = [];
    const objectCount = Math.floor(Math.random() * 3) + 1; // 1-3 объекта
    
    const rarities: GameItem['rarity'][] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const types: GameItem['type'][] = ['weapon', 'armor', 'artifact', 'resource', 'consumable'];
    
    for (let i = 0; i < objectCount; i++) {
      const rarity = rarities[Math.floor(Math.random() * rarities.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      
      // Случайное позиционирование на экране
      const x = Math.random() * 80 + 10; // 10-90% от ширины
      const y = Math.random() * 60 + 20; // 20-80% от высоты
      
      const captureTime = 
        rarity === 'legendary' ? 9 :
        rarity === 'epic' ? 7 :
        rarity === 'rare' ? 5 :
        rarity === 'uncommon' ? 4 : 3;
      
      objects.push({
        id: `ar_${Date.now()}_${i}`,
        type,
        name: generateItemName(type, rarity),
        rarity,
        description: `AR объект в радиусе 50 метров`,
        icon: getItemIcon(type),
        value: calculateItemValue(rarity),
        coordinates: [location.latitude, location.longitude],
        captureTime,
        properties: {
          screenX: x,
          screenY: y,
          distance: Math.random() * 45 + 5 // 5-50 метров
        }
      });
    }
    
    setArObjects(objects);
  };

  // Начало сбора предмета
  const startCapture = (item: GameItem) => {
    if (isMoving) {
      setNotification('Не двигайтесь во время сбора!');
      return;
    }

    if (activeCapture) {
      setNotification('Сбор уже в процессе');
      return;
    }

    setActiveCapture({
      itemId: item.id,
      startTime: Date.now(),
      progress: 0,
      isCapturing: true,
      requiredTime: item.captureTime! * 1000 // мс
    });

    setNotification(`Начался сбор ${item.name}. Не двигайтесь!`);
  };

  // Обновление прогресса сбора
  useEffect(() => {
    if (!activeCapture || !activeCapture.isCapturing) return;

    const updateProgress = () => {
      const elapsed = Date.now() - activeCapture.startTime;
      const progress = Math.min((elapsed / activeCapture.requiredTime) * 100, 100);
      
      setActiveCapture(prev => prev ? { ...prev, progress } : null);
      
      if (progress >= 100) {
        completeCapture();
      }
    };

    const interval = setInterval(updateProgress, 50);
    return () => clearInterval(interval);
  }, [activeCapture]);

  // Завершение сбора
  const completeCapture = () => {
    if (!activeCapture) return;

    const item = arObjects.find(obj => obj.id === activeCapture.itemId);
    if (!item) return;

    // Добавляем в инвентарь
    setInventory(prev => [...prev, item]);
    
    // Награда в валюте
    const reward = Math.floor(item.value / 10);
    setCurrency({
      ...currency,
      tokens: currency.tokens + reward,
      shards: currency.shards + Math.floor(reward / 5)
    });
    
    // Удаляем объект с карты
    setArObjects(prev => prev.filter(obj => obj.id !== item.id));
    
    setActiveCapture(null);
    setNotification(`Собран: ${item.name}! +${reward} токенов`);
    
    // Генерируем новые объекты через некоторое время
    setTimeout(() => {
      if (isCameraActive) {
        generateARObjects();
      }
    }, 5000);
  };

  // Отмена сбора
  const cancelCapture = () => {
    setActiveCapture(null);
    setNotification('Сбор отменен');
  };

  // Вспомогательные функции
  const generateItemName = (type: GameItem['type'], rarity: GameItem['rarity']): string => {
    const prefixes = {
      common: ['Обычный', 'Простой'],
      uncommon: ['Необычный', 'Улучшенный'],
      rare: ['Редкий', 'Кибер'],
      epic: ['Эпический', 'Квантовый'],
      legendary: ['Легендарный', 'Мифический']
    };
    
    const names = {
      weapon: ['Клинок', 'Пистолет', 'Винтовка'],
      armor: ['Броня', 'Костюм', 'Щит'],
      artifact: ['Кристалл', 'Руна', 'Матрица'],
      resource: ['Металл', 'Энергия', 'Плазма'],
      consumable: ['Стимпак', 'Батарея', 'Бустер']
    };
    
    const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];
    const name = names[type][Math.floor(Math.random() * names[type].length)];
    
    return `${prefix} ${name}`;
  };

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

  const calculateItemValue = (rarity: GameItem['rarity']): number => {
    const values = {
      common: 100,
      uncommon: 300,
      rare: 800,
      epic: 2000,
      legendary: 6000
    };
    return values[rarity] + Math.floor(Math.random() * values[rarity] * 0.3);
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Видео элемент - всегда в DOM для videoRef */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full h-full object-cover absolute inset-0 z-10 ${
          isCameraActive ? 'block' : 'hidden'
        }`}
      />
      
      {/* Контрольная панель */}
      <div className="glass-panel m-4 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <CameraIcon size={24} className="text-neon-purple" />
            <h2 className="font-heading text-xl text-neon-purple">
              AR Сбор предметов
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Индикатор движения */}
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                isMoving ? 'bg-neon-pink animate-pulse' : 'bg-neon-green'
              }`}></div>
              <p className="text-xs text-text-muted">
                {isMoving ? 'Движение' : 'Покой'}
              </p>
            </div>
            
            {/* Количество предметов в инвентаре */}
            <div className="text-center">
              <BackpackIcon size={20} className="text-neon-blue mx-auto mb-1" />
              <p className="text-xs text-neon-blue font-mono">{inventory.length}</p>
            </div>
          </div>
        </div>

        {/* Мобильные кнопки управления - БОЛЬШИЕ для удобства */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            className={`btn-neon mobile-touch ${isCameraActive ? 'pink' : 'green'} text-lg py-4 px-6`}
            onClick={isCameraActive ? stopCamera : startCamera}
            disabled={loading}
          >
            <div className="flex items-center justify-center space-x-3">
              <CameraIcon size={24} />
              <span className="font-semibold">
                {loading ? 'Запуск...' : isCameraActive ? 'Остановить AR' : 'Запустить AR'}
              </span>
            </div>
          </button>
          
          {activeCapture && (
            <button
              className="btn-neon mobile-touch pink text-lg py-4 px-6"
              onClick={cancelCapture}
            >
              <div className="flex items-center justify-center space-x-3">
                <span>❌</span>
                <span className="font-semibold">Отменить сбор</span>
              </div>
            </button>
          )}
          
          {isCameraActive && (
            <button
              className="btn-neon mobile-touch purple text-lg py-4 px-6"
              onClick={generateARObjects}
            >
              <div className="flex items-center justify-center space-x-3">
                <span>🔄</span>
                <span className="font-semibold">Обновить объекты</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* AR область */}
      <div className="flex-1 relative">
        {isCameraActive || loading ? (
          <div className="ar-camera-container relative w-full h-full overflow-hidden">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                <div className="text-center">
                  <div className="spinner mx-auto mb-4"></div>
                  <p className="text-neon-blue">Запуск камеры...</p>
                  <p className="text-xs text-text-secondary mt-2">Пожалуйста, разрешите доступ к камере</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
                <div className="text-center p-4">
                  <div className="text-neon-pink text-4xl mb-2">⚠️</div>
                  <h3 className="text-neon-pink font-heading mb-2">Ошибка камеры</h3>
                  <p className="text-text-primary mb-4">{error}</p>
                  <button 
                    className="btn-neon pink px-4 py-2"
                    onClick={() => {
                      setError(null);
                      startCamera();
                    }}
                  >
                    Повторить
                  </button>
                </div>
              </div>
            )}
            
            {/* Видео отображается через основной видео элемент поверх всего */}
            
            {/* AR Overlay - поверх видео */}
            <div className="ar-overlay absolute inset-0 z-20">
              {/* Прицел */}
              <div className="ar-crosshair">
                <CrosshairIcon size={40} className="text-neon-blue" />
              </div>
              
              {/* AR объекты */}
              {arObjects.map((item) => (
                <div
                  key={item.id}
                  className={`ar-object absolute cursor-pointer ${
                    activeCapture?.itemId === item.id ? 'pointer-events-none' : 'pointer-events-auto'
                  }`}
                  style={{
                    left: `${item.properties?.screenX}%`,
                    top: `${item.properties?.screenY}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  onClick={() => startCapture(item)}
                >
                  {/* Основной объект */}
                  <div className={`
                    w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 flex items-center justify-center text-3xl sm:text-4xl
                    transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer touch-manipulation
                    ${
                      item.rarity === 'legendary' ? 'border-neon-orange bg-neon-orange bg-opacity-20 glow-pulse' :
                      item.rarity === 'epic' ? 'border-neon-purple bg-neon-purple bg-opacity-20' :
                      item.rarity === 'rare' ? 'border-neon-blue bg-neon-blue bg-opacity-20' :
                      item.rarity === 'uncommon' ? 'border-neon-green bg-neon-green bg-opacity-20' :
                      'border-gray-400 bg-gray-400 bg-opacity-20'
                    }
                  `}>
                    {item.icon}
                  </div>
                  
                  {/* Информация о предмете */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 glass-panel p-2 min-w-max">
                    <p className={`text-xs font-semibold ${
                      item.rarity === 'legendary' ? 'text-neon-orange' :
                      item.rarity === 'epic' ? 'text-neon-purple' :
                      item.rarity === 'rare' ? 'text-neon-blue' :
                      item.rarity === 'uncommon' ? 'text-neon-green' :
                      'text-gray-400'
                    }`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      Расстояние: {Math.round(item.properties?.distance || 0)}м
                    </p>
                    <p className="text-xs text-neon-yellow">
                      Сбор: {item.captureTime}с
                    </p>
                  </div>
                  
                  {/* Прогресс сбора */}
                  {activeCapture?.itemId === item.id && (
                    <div className="ar-capture-progress">
                      <div 
                        className="ar-capture-fill"
                        style={{ width: `${activeCapture.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Информация о сборе */}
              {activeCapture && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 glass-panel p-4">
                  <div className="text-center">
                    <p className="text-neon-yellow mb-2">
                      Сбор в процессе...
                    </p>
                    <div className="progress-bar w-48 mb-2">
                      <div 
                        className="progress-fill"
                        style={{ width: `${activeCapture.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-muted">
                      {Math.round(activeCapture.progress)}% | Не двигайтесь!
                    </p>
                  </div>
                </div>
              )}
              
              {/* Предупреждение о движении */}
              {isMoving && (
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 glass-panel p-3 border-2 border-neon-pink">
                  <p className="text-neon-pink text-center font-semibold">
                    ⚠️ Остановитесь для сбора!
                  </p>
                </div>
              )}
              
              {/* Информация о найденных объектах */}
              <div className="absolute top-4 right-4 glass-panel p-3">
                <p className="text-xs text-text-secondary mb-1">Объекты в радиусе:</p>
                <p className="text-lg font-mono text-neon-green">{arObjects.length}</p>
              </div>
            </div>
          </div>
        ) : (
          /* Пласт-скрин до запуска камеры */
          <div className="w-full h-full bg-bg-secondary cyber-grid flex items-center justify-center">
            <div className="text-center">
              <CameraIcon size={80} className="text-neon-purple opacity-50 mb-4 mx-auto" />
              <h3 className="font-heading text-xl text-neon-purple mb-2">
                AR Режим не активен
              </h3>
              <p className="text-text-secondary mb-4">
                Нажмите "Запустить AR" для начала сбора предметов
              </p>
              
              {!location && (
                <div className="cyber-card p-4 border-neon-yellow">
                  <p className="text-neon-yellow text-sm">
                    ⚠️ Местоположение не определено.<br/>
                    AR сбор может работать некорректно.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Инвентарь */}
      {inventory.length > 0 && (
        <div className="glass-panel m-4 p-4">
          <h3 className="font-heading text-lg mb-3 text-neon-purple flex items-center space-x-2">
            <BackpackIcon size={20} />
            <span>Инвентарь ({inventory.length})</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-32 overflow-y-auto">
            {inventory.slice(-8).map((item) => (
              <div
                key={item.id}
                className={`cyber-card p-2 text-center rarity-${item.rarity}`}
              >
                <div className="text-xl mb-1">{item.icon}</div>
                <p className={`text-xs font-semibold mb-1 ${
                  item.rarity === 'legendary' ? 'text-neon-orange' :
                  item.rarity === 'epic' ? 'text-neon-purple' :
                  item.rarity === 'rare' ? 'text-neon-blue' :
                  item.rarity === 'uncommon' ? 'text-neon-green' :
                  'text-gray-400'
                }`}>
                  {item.name}
                </p>
                <p className="text-xs text-neon-yellow">
                  {item.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          
          {inventory.length > 8 && (
            <p className="text-xs text-text-muted text-center mt-2">
              Показано последние 8 предметов
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ARCollectionPage;