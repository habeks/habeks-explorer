import { latLngToCell, cellToBoundary, gridDisk, cellToLatLng } from 'h3-js';
import { HexTile, Location } from '../types';

// Константы для разных слоев H3
export const H3_RESOLUTIONS = {
  LAYER_1: 15, // ~6 метров (базовый)
  LAYER_2: 12, // ~100 метров (улицы)
  LAYER_3: 9,  // ~1 км (районы)
  LAYER_4: 6,  // ~10 км (города)
  LAYER_5: 3   // ~100 км (страны)
} as const;

// Получение H3 индекса для координат
export const getH3Index = (lat: number, lng: number, resolution: number): string => {
  return latLngToCell(lat, lng, resolution);
};

// Получение центра гексагона
export const getHexCenter = (hexId: string): [number, number] => {
  const [lat, lng] = cellToLatLng(hexId);
  return [lat, lng];
};

// Получение границ гексагона
export const getHexBoundary = (hexId: string): Array<[number, number]> => {
  return cellToBoundary(hexId, true); // true для GeoJSON формата
};

// Получение соседних гексагонов
export const getNeighborHexes = (hexId: string, rings: number = 1): string[] => {
  return gridDisk(hexId, rings);
};

// Получение гексагонов в радиусе
export const getHexesInRadius = (
  centerLat: number, 
  centerLng: number, 
  radiusMeters: number, 
  resolution: number
): string[] => {
  const centerHex = getH3Index(centerLat, centerLng, resolution);
  
  // Приблизительное количество колец на основе радиуса
  const avgHexSizeMeters = getAverageHexagonSizeMeters(resolution);
  const rings = Math.ceil(radiusMeters / avgHexSizeMeters);
  
  return gridDisk(centerHex, rings);
};

// Получение приблизительного размера гексагона в метрах
const getAverageHexagonSizeMeters = (resolution: number): number => {
  // Приблизительные размеры для каждого разрешения
  const sizes: Record<number, number> = {
    15: 6,     // ~6 метров
    14: 18,    // ~18 метров
    13: 54,    // ~54 метра
    12: 162,   // ~162 метра
    11: 486,   // ~486 метров
    10: 1458,  // ~1.5 км
    9: 4374,   // ~4.4 км
    8: 13122,  // ~13 км
    7: 39366,  // ~39 км
    6: 118098, // ~118 км
    5: 354294, // ~354 км
    4: 1062882, // ~1062 км
    3: 3188646, // ~3188 км
    2: 9565938, // ~9565 км
    1: 28697814, // ~28697 км
    0: 86093442  // ~86093 км
  };
  
  return sizes[resolution] || 1000;
};

// Преобразование H3 в GeoJSON полигон
export const hexToGeoJSON = (hexId: string) => {
  const boundary = getHexBoundary(hexId);
  
  return {
    type: 'Feature' as const,
    properties: {
      hexId,
      resolution: hexId.length - 2 // Приблизительное определение разрешения
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [boundary]
    }
  };
};

// Получение всех видимых гексагонов для карты
export const getVisibleHexes = (
  viewport: {
    latitude: number;
    longitude: number;
    zoom: number;
  },
  mapSize: { width: number; height: number }
): string[] => {
  // Определяем разрешение на основе zoom
  const resolution = getResolutionForZoom(viewport.zoom);
  
  // Приблизительное определение границ вьюпорта
  const { latitude, longitude } = viewport;
  
  // Приблизительное расстояние от центра до края экрана
  const screenRadiusKm = getScreenRadiusKm(viewport.zoom);
  const radiusMeters = screenRadiusKm * 1000;
  
  return getHexesInRadius(latitude, longitude, radiusMeters, resolution);
};

// Определение разрешения H3 на основе уровня масштаба
const getResolutionForZoom = (zoom: number): number => {
  if (zoom >= 18) return H3_RESOLUTIONS.LAYER_1; // 15
  if (zoom >= 15) return H3_RESOLUTIONS.LAYER_2; // 12
  if (zoom >= 12) return H3_RESOLUTIONS.LAYER_3; // 9
  if (zoom >= 8) return H3_RESOLUTIONS.LAYER_4;  // 6
  return H3_RESOLUTIONS.LAYER_5; // 3
};

// Приблизительный радиус экрана в км
const getScreenRadiusKm = (zoom: number): number => {
  // Приблизительное соотношение zoom к радиусу
  return Math.pow(2, 20 - zoom) * 0.00001;
};

// Устаревшие функции удалены, так как теперь используется DataService

// Получение 37 гексагонов для массовой покупки (3 кольца)
export const getBulkPurchaseHexes = (centerHexId: string): string[] => {
  return gridDisk(centerHexId, 3); // 3 кольца = 37 гексагонов
};

// Вычисление расстояния между двумя точками (в метрах)
export const calculateDistance = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371000; // Радиус Земли в метрах
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Проверка, находится ли точка внутри гексагона
export const isPointInHex = (lat: number, lng: number, hexId: string): boolean => {
  const currentHex = getH3Index(lat, lng, hexId.length - 2);
  return currentHex === hexId;
};