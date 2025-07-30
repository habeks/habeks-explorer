import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Player, Currency, Location, HexTile } from '../../types';
import { 
  MapIcon, 
  HexagonIcon, 
  PlusIcon, 
  MinusIcon, 
  CrystalIcon,
  LightningIcon,
  TargetIcon,
  GridIcon,
  EyeIcon,
  EyeOffIcon,
  ShoppingCartIcon
} from '../Icons';
import { MapView } from '../map/MapView';
import { HexGrid } from '../map/HexGrid';
import { getResolutionForZoom, getRadiusForZoom, calculateBulkPurchaseCost } from '../../utils/hexUtils';
import { useHexTiles } from '../../hooks/useHexTiles';
import { H3_RESOLUTIONS } from '../../types/hex';
import '../../styles/map.css';

interface OwnershipMapProps {
  player: Player | null;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  location: Location | null;
  setNotification: (message: string) => void;
}

export const OwnershipMap: React.FC<OwnershipMapProps> = ({
  player,
  currency,
  setCurrency,
  location,
  setNotification
}) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedHexes, setSelectedHexes] = useState<Set<string>>(new Set());
  const [currentZoom, setCurrentZoom] = useState(12);
  const [mapCenter, setMapCenter] = useState({ lat: 55.7558, lng: 37.6173 }); // Москва по умолчанию
  const [bulkPurchaseMode, setBulkPurchaseMode] = useState(false);
  const [totalPurchaseCost, setTotalPurchaseCost] = useState(0);
  const [showHexGrid, setShowHexGrid] = useState(true);
  const [isCompactMode, setIsCompactMode] = useState(false);

  // Используем новый хук для управления hex-тайлами
  const { 
    hexTiles, 
    isLoading, 
    error: hexError, 
    updateHexOwnership, 
    updateMultipleHexOwnership, 
    refresh: refreshHexTiles 
  } = useHexTiles(location);

  // Инициализация местоположения
  useEffect(() => {
    if (location) {
      setMapCenter({ lat: location.latitude, lng: location.longitude });
    }
  }, [location]);

  // Обработчик загрузки карты
  const handleMapLoad = (map: maplibregl.Map) => {
    mapRef.current = map;
    
    // Обработчики событий карты
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });
    
    map.on('moveend', () => {
      const center = map.getCenter();
      setMapCenter({ lat: center.lat, lng: center.lng });
    });
  };

  // Обработчик клика по гексу
  const handleHexClick = (hexId: string, hexData: HexTile) => {
    if (bulkPurchaseMode) {
      // В режиме массовой покупки покупаем область 37 гексов
      handleBulkPurchase(hexId);
    } else {
      // Обычный режим - выбор отдельных гексов
      const newSelection = new Set(selectedHexes);
      if (newSelection.has(hexId)) {
        newSelection.delete(hexId);
      } else {
        newSelection.add(hexId);
      }
      setSelectedHexes(newSelection);
    }
  };

  // Массовая покупка
  const handleBulkPurchase = async (centerHexId: string) => {
    const bulkPurchaseData = calculateBulkPurchaseCost(centerHexId, 3, hexTiles);
    const { totalCost, availableHexes } = bulkPurchaseData;
    
    if (currency.tokens < totalCost) {
      setNotification(`Недостаточно токенов. Нужно: ${totalCost.toLocaleString()}`);
      return;
    }

    if (availableHexes.length === 0) {
      setNotification('Нет доступных гексов для покупки в этой области');
      return;
    }

    try {
      // Покупаем доступные гексы
      await updateMultipleHexOwnership(availableHexes, 'owned');
      
      setCurrency({
        ...currency,
        tokens: currency.tokens - totalCost
      });
      
      setNotification(`Куплено ${availableHexes.length} гексов за ${totalCost.toLocaleString()} токенов!`);
      setBulkPurchaseMode(false);
      
      // Обновляем данные
      refreshHexTiles();
    } catch (error) {
      setNotification('Ошибка при покупке гексов');
    }
  };

  // Покупка выбранных гексов
  const handlePurchaseSelected = async () => {
    if (selectedHexes.size === 0) return;
    
    if (currency.tokens < totalPurchaseCost) {
      setNotification(`Недостаточно токенов. Нужно: ${totalPurchaseCost.toLocaleString()}`);
      return;
    }

    try {
      // Обновляем владение выбранными гексами
      await updateMultipleHexOwnership(Array.from(selectedHexes), 'owned');
      
      // Списываем токены
      setCurrency({
        ...currency,
        tokens: currency.tokens - totalPurchaseCost
      });
      
      setNotification(`Куплено ${selectedHexes.size} гексов за ${totalPurchaseCost.toLocaleString()} токенов!`);
      setSelectedHexes(new Set());
    } catch (error) {
      setNotification('Ошибка при покупке гексов');
    }
  };

  // Очистка выбора
  const clearSelection = () => {
    setSelectedHexes(new Set());
  };

  // Обновление стоимости при изменении выбора
  useEffect(() => {
    const cost = selectedHexes.size * 1000; // 1000 токенов за гекс
    setTotalPurchaseCost(cost);
  }, [selectedHexes]);

  // Переключение отображения сетки
  const handleToggleHexGrid = () => {
    setShowHexGrid(!showHexGrid);
  };

  // Статистика гексов
  const getHexStats = () => {
    const owned = hexTiles.filter(hex => hex.ownershipStatus === 'owned').length;
    const enemy = hexTiles.filter(hex => hex.ownershipStatus === 'enemy').length;
    const free = hexTiles.filter(hex => hex.ownershipStatus === 'free').length;
    return { owned, enemy, free, total: hexTiles.length };
  };

  return (
    <div className="h-full w-full relative bg-dark-primary overflow-hidden">
      {/* Полноэкранная карта */}
      <div className="absolute inset-0">
        <MapView
          center={mapCenter}
          zoom={currentZoom}
          location={location}
          onMapLoad={handleMapLoad}
          showHexGrid={false}
        >
          {mapRef.current && showHexGrid && (
            <HexGrid
              map={mapRef.current}
              center={mapCenter}
              resolution={getResolutionForZoom(currentZoom)}
              onHexClick={handleHexClick}
              selectedHexes={selectedHexes}
            />
          )}
        </MapView>
      </div>

      {/* Верхняя панель управления - компактная */}
      <div className="absolute top-4 left-4 right-4 z-40">
        <div className="glass-panel bg-dark-primary/85 backdrop-blur-xl border border-accent-primary/40 rounded-2xl p-3 shadow-neon">
          <div className="flex items-center justify-between">
            {/* Левая часть - заголовок */}
            <div className="flex items-center space-x-2">
              <HexagonIcon className="w-5 h-5 text-accent-primary" />
              <h2 className="text-lg font-bold text-text-primary">Карта владений</h2>
              <div className="text-xs text-text-secondary">
                {currentZoom.toFixed(1)}x
              </div>
            </div>

            {/* Правая часть - кнопки управления */}
            <div className="flex items-center space-x-2">
              {/* Кнопка сетки */}
              <button
                className={`p-2 rounded-lg transition-all duration-300 border ${
                  showHexGrid 
                    ? 'bg-accent-primary/20 border-accent-primary text-accent-primary shadow-[0_0_12px_rgba(0,212,255,0.4)]' 
                    : 'bg-dark-secondary/60 border-accent-primary/30 text-text-secondary hover:border-accent-primary hover:text-accent-primary'
                }`}
                onClick={handleToggleHexGrid}
                title={showHexGrid ? 'Скрыть сетку' : 'Показать сетку'}
              >
                <GridIcon className="w-4 h-4" />
              </button>

              {/* Кнопка массовой покупки */}
              <button
                className={`p-2 rounded-lg transition-all duration-300 border ${
                  bulkPurchaseMode 
                    ? 'bg-accent-secondary/20 border-accent-secondary text-accent-secondary shadow-[0_0_12px_rgba(168,85,247,0.4)]' 
                    : 'bg-dark-secondary/60 border-accent-secondary/30 text-text-secondary hover:border-accent-secondary hover:text-accent-secondary'
                }`}
                onClick={() => setBulkPurchaseMode(!bulkPurchaseMode)}
                title={bulkPurchaseMode ? 'Отключить массовую покупку' : 'Массовая покупка (37 гексов)'}
              >
                <ShoppingCartIcon className="w-4 h-4" />
              </button>

              {/* Кнопка очистки выбора */}
              {selectedHexes.size > 0 && (
                <button 
                  className="p-2 rounded-lg transition-all duration-300 border bg-red-600/20 border-red-500/30 text-red-400 hover:border-red-500 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)]" 
                  onClick={clearSelection}
                  title={`Очистить выбор (${selectedHexes.size})`}
                >
                  <span className="text-xs font-bold">{selectedHexes.size}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Информация о выборе - плавающая панель снизу */}
      {selectedHexes.size > 0 && (
        <div className="absolute bottom-24 left-4 right-4 z-40">
          <div className="glass-panel bg-dark-primary/90 backdrop-blur-xl border border-accent-primary/40 rounded-2xl p-4 shadow-neon">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-text-secondary mb-1">
                  Выбрано тайлов: <span className="text-accent-primary font-bold">{selectedHexes.size}</span>
                </p>
                <p className="font-mono text-lg text-text-primary">
                  Стоимость: <span className="text-yellow-400 font-bold">{totalPurchaseCost.toLocaleString()}</span> токенов
                </p>
              </div>
              
              <button
                className={`px-6 py-3 rounded-xl border transition-all duration-300 font-medium flex items-center space-x-2 ${
                  currency.tokens >= totalPurchaseCost
                    ? 'bg-green-600/20 border-green-500/40 text-green-400 hover:bg-green-600/30 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                    : 'bg-red-600/20 border-red-500/40 text-red-400 cursor-not-allowed'
                }`}
                onClick={handlePurchaseSelected}
                disabled={currency.tokens < totalPurchaseCost}
              >
                <CrystalIcon className="w-5 h-5" />
                <span>Купить</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Индикатор режима массовой покупки */}
      {bulkPurchaseMode && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="glass-panel bg-accent-secondary/90 backdrop-blur-xl border border-accent-secondary rounded-2xl px-6 py-4 shadow-[0_0_30px_rgba(168,85,247,0.6)]">
            <div className="text-dark-primary text-center font-bold">
              <TargetIcon className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p className="text-lg">Массовая покупка</p>
              <p className="text-sm opacity-80">Кликните по центру области</p>
            </div>
          </div>
        </div>
      )}

      {/* Компактная легенда в правом нижнем углу */}
      <div className="absolute bottom-24 right-4 z-40">
        <div className="glass-panel bg-dark-primary/80 backdrop-blur-xl border border-accent-primary/30 rounded-xl p-3 shadow-neon">
          <h4 className="text-xs font-bold mb-2 text-accent-primary">Легенда</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border border-green-500/60 bg-green-500/30 rounded"></div>
              <span className="text-text-secondary">Мои ({getHexStats().owned})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border border-red-500/60 bg-red-500/30 rounded"></div>
              <span className="text-text-secondary">Чужие ({getHexStats().enemy})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border border-gray-500/60 bg-gray-500/30 rounded"></div>
              <span className="text-text-secondary">Свободные ({getHexStats().free})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="glass-panel bg-dark-primary/90 backdrop-blur-xl border border-accent-primary/40 rounded-xl px-4 py-2 shadow-neon">
            <div className="flex items-center space-x-2 text-accent-primary">
              <div className="w-4 h-4 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Загрузка гексов...</span>
            </div>
          </div>
        </div>
      )}

      {/* Ошибка загрузки */}
      {hexError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="glass-panel bg-red-600/90 backdrop-blur-xl border border-red-500/40 rounded-xl px-4 py-2 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <span className="text-sm font-medium text-white">Ошибка: {hexError}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnershipMap;
