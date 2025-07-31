import React, { useEffect, useState, useRef } from 'react';
import { latLngToCell, cellToBoundary, gridDistance, cellToLatLng, gridDisk } from 'h3-js';
import maplibregl from 'maplibre-gl';
import { HexTile, HexOwnershipStatus } from '../../types';
import { dataService } from '../../services/DataService';

interface HexGridProps {
  map: maplibregl.Map;
  center: { lat: number; lng: number };
  resolution?: number;
  onHexClick?: (hexId: string, hexData: HexTile) => void;
  selectedHexes?: Set<string>;
}

export const HexGrid: React.FC<HexGridProps> = ({
  map,
  center,
  resolution = 9, // H3 resolution (0-15), 9 примерно соответствует размеру квартала
  onHexClick,
  selectedHexes = new Set()
}) => {
  const [currentResolution, setCurrentResolution] = useState(resolution);
  const [hexTiles, setHexTiles] = useState<HexTile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const sourceId = 'hex-grid-source';
  const layerId = 'hex-grid-layer';
  const [isInitialized, setIsInitialized] = useState(false);

  // Определение разрешения на основе зума карты
  const getResolutionFromZoom = (zoom: number): number => {
    if (zoom >= 16) return 10; // Очень близко - мелкие гексы
    if (zoom >= 14) return 9;  // Близко - средние гексы
    if (zoom >= 12) return 8;  // Средний зум - крупные гексы
    if (zoom >= 10) return 7;  // Далеко - очень крупные гексы
    return 6; // Очень далеко - максимально крупные гексы
  };

  // Асинхронная загрузка hex-тайлов
  const loadHexData = async () => {
    if (isLoading) return; // Предотвращаем повторные запросы
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log('🔄 Загрузка hex-тайлов...');
      
      const tiles = await dataService.loadHexTiles({
        latitude: center.lat,
        longitude: center.lng,
        accuracy: 1000,
        timestamp: Date.now()
      });
      
      setHexTiles(tiles);
      console.log(`✅ Загружено ${tiles.length} hex-тайлов`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('❌ Ошибка при загрузке hex-тайлов:', error);
      setLoadError(errorMessage);
      setHexTiles([]); // Очищаем тайлы при ошибке
    } finally {
      setIsLoading(false);
    }
  };

  // Получение цвета гекса в зависимости от владения
  const getHexColor = (status: HexOwnershipStatus, isSelected: boolean = false): string => {
    if (isSelected) {
      return '#ffd700'; // Золотой для выбранных
    }
    
    switch (status) {
      case 'owned':
        return '#00ff88'; // Зеленый для своих
      case 'enemy':
        return '#ff3366'; // Красный для чужих
      case 'free':
      default:
        return '#666666'; // Серый для свободных
    }
  };

  // Генерация гексагональной сетки вокруг центра
  const generateHexGrid = (centerLat: number, centerLng: number, res: number, radius: number = 3): maplibregl.GeoJSONSourceSpecification['data'] => {
    try {
      // Получаем H3 индекс центральной ячейки
      const centerHex = latLngToCell(centerLat, centerLng, res);
      
      // Получаем все гексы в радиусе
      const hexIds = gridDisk(centerHex, radius);
      
      const features: any[] = [];
      
      hexIds.forEach(hexId => {
        try {
          // Получаем границы гекса
          const boundary = cellToBoundary(hexId, true); // true для географических координат
          
          // Поиск данных гекса в переданных hexTiles
          const hexData = hexTiles.find(tile => tile.h3Index === hexId);
          const ownershipStatus = hexData?.ownershipStatus || 'free';
          const isSelected = selectedHexes.has(hexId);
          
          // Создаем GeoJSON feature для гекса
          const feature = {
            type: 'Feature' as const,
            properties: {
              hexId: hexId,
              ownershipStatus: ownershipStatus,
              isSelected: isSelected,
              price: hexData?.price || 100,
              owner: hexData?.owner || null
            },
            geometry: {
              type: 'Polygon' as const,
              coordinates: [boundary.map(([lat, lng]) => [lng, lat])] // MapLibre ожидает [lng, lat]
            }
          };
          
          features.push(feature);
        } catch (error) {
          console.warn(`Ошибка при обработке гекса ${hexId}:`, error);
        }
      });
      
      return {
        type: 'FeatureCollection' as const,
        features: features
      };
    } catch (error) {
      console.error('Ошибка при генерации гексагональной сетки:', error);
      return {
        type: 'FeatureCollection' as const,
        features: []
      };
    }
  };

  // Загрузка данных при изменении центра карты - с задержкой чтобы сначала показать сетку
  useEffect(() => {
    // Сначала показываем пустую сетку, затем загружаем данные о владении
    const timer = setTimeout(() => {
      loadHexData();
    }, 500); // Небольшая задержка
    
    return () => clearTimeout(timer);
  }, [center.lat, center.lng]);

  // Инициализация источника данных и слоя
  useEffect(() => {
    if (!map || !map.isStyleLoaded() || isLoading) return;

    try {
      // Проверяем, есть ли уже источник данных
      if (map.getSource(sourceId)) {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getLayer(`${layerId}-stroke`)) {
          map.removeLayer(`${layerId}-stroke`);
        }
        map.removeSource(sourceId);
      }

      // Генерируем данные гексагональной сетки
      const hexGridData = generateHexGrid(center.lat, center.lng, currentResolution);

      // Показываем сетку даже если нет данных о владении
      if (typeof hexGridData === 'object' && 'features' in hexGridData && hexGridData.features.length === 0) {
        console.log('⚠️ Создание базовой сетки без данных о владении');
        // Не возвращаемся, создаем базовую сетку
      }

      // Добавляем источник данных
      map.addSource(sourceId, {
        type: 'geojson',
        data: hexGridData
      });

      // Добавляем слой для заливки гексов
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': [
            'case',
            ['get', 'isSelected'], '#ffd700',
            ['==', ['get', 'ownershipStatus'], 'owned'], '#00ff88',
            ['==', ['get', 'ownershipStatus'], 'enemy'], '#ff3366',
            '#666666'
          ],
          'fill-opacity': 0.3,
          'fill-outline-color': [
            'case',
            ['get', 'isSelected'], '#ffd700',
            ['==', ['get', 'ownershipStatus'], 'owned'], '#00ff88',
            ['==', ['get', 'ownershipStatus'], 'enemy'], '#ff3366',
            '#888888'
          ]
        }
      });

      // Добавляем слой для границ гексов
      map.addLayer({
        id: `${layerId}-stroke`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': [
            'case',
            ['get', 'isSelected'], '#ffd700',
            ['==', ['get', 'ownershipStatus'], 'owned'], '#00ff88',
            ['==', ['get', 'ownershipStatus'], 'enemy'], '#ff3366',
            '#888888'
          ],
          'line-width': [
            'case',
            ['get', 'isSelected'], 3,
            2
          ],
          'line-opacity': 0.8
        }
      });

      // Добавляем обработчик кликов
      if (onHexClick) {
        map.on('click', layerId, (e) => {
          if (e.features && e.features[0]) {
            const feature = e.features[0];
            const hexId = feature.properties?.hexId;
            if (hexId) {
              const [lat, lng] = cellToLatLng(hexId);
              const hexData: HexTile = {
                h3Index: hexId,
                coordinates: { lat, lng },
                ownershipStatus: feature.properties?.ownershipStatus || 'free',
                price: feature.properties?.price || 100,
                owner: feature.properties?.owner || null,
                lastUpdated: Date.now()
              };
              onHexClick(hexId, hexData);
            }
          }
        });
      }

      // Изменение курсора при наведении
      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });

      setIsInitialized(true);
      console.log('✅ HexGrid успешно инициализирован');
    } catch (error) {
      console.error('❌ Ошибка при инициализации HexGrid:', error);
    }
  }, [map, center, currentResolution, hexTiles, selectedHexes, onHexClick]);

  // Обновление данных при изменении выбранных гексов
  useEffect(() => {
    if (!map || !isInitialized || !map.getSource(sourceId) || isLoading) return;

    try {
      const hexGridData = generateHexGrid(center.lat, center.lng, currentResolution);
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(hexGridData);
      console.log('🔄 Обновлены выбранные гексы');
    } catch (error) {
      console.error('❌ Ошибка при обновлении выбранных гексов:', error);
    }
  }, [selectedHexes]);

  // Обновление разрешения при изменении зума
  useEffect(() => {
    if (!map) return;
    
    const handleZoom = () => {
      const zoom = map.getZoom();
      const newResolution = getResolutionFromZoom(zoom);
      if (newResolution !== currentResolution) {
        setCurrentResolution(newResolution);
      }
    };

    map.on('zoom', handleZoom);
    
    return () => {
      if (map) {
        map.off('zoom', handleZoom);
      }
    };
  }, [map, currentResolution, getResolutionFromZoom]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      if (map && map.getStyle) {
        try {
          if (map.getLayer?.(layerId)) {
            map.removeLayer(layerId);
          }
          if (map.getLayer?.(`${layerId}-stroke`)) {
            map.removeLayer(`${layerId}-stroke`);
          }
          if (map.getSource?.(sourceId)) {
            map.removeSource(sourceId);
          }
        } catch (error) {
          console.warn('Ошибка при очистке HexGrid:', error);
        }
      }
    };
  }, []);

  // Отображаем сообщения о состоянии в консоли (для отладки)
  useEffect(() => {
    if (isLoading) {
      console.log('⏳ Загрузка hex-тайлов...');
    } else if (loadError) {
      console.error('❌ Ошибка загрузки:', loadError);
    } else if (hexTiles.length > 0) {
      console.log(`✅ Загружено ${hexTiles.length} hex-тайлов`);
    }
  }, [isLoading, loadError, hexTiles.length]);

  return null; // Этот компонент не рендерит визуальных элементов напрямую
};

export default HexGrid;