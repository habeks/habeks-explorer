// Утилиты для работы с H3 гексагональной системой
import { 
  latLngToCell, 
  cellToBoundary, 
  cellToLatLng,
  gridDisk,
  gridDistance,
  getResolution,
  isValidCell
} from 'h3-js';
import { HexTile, HexOwnershipStatus, H3_RESOLUTIONS } from '../types/hex';
import { Location } from '../types';

/**
 * Получает подходящее H3 разрешение на основе зума карты
 */
export const getResolutionForZoom = (zoom: number): number => {
  if (zoom >= 16) return H3_RESOLUTIONS.BUILDING; // Очень близко
  if (zoom >= 14) return H3_RESOLUTIONS.STREET;   // Близко
  if (zoom >= 12) return H3_RESOLUTIONS.DISTRICT; // Средний зум
  if (zoom >= 10) return H3_RESOLUTIONS.CITY;     // Далеко
  return H3_RESOLUTIONS.COUNTRY; // Очень далеко
};

/**
 * Получает радиус области для загрузки тайлов на основе зума
 */
export const getRadiusForZoom = (zoom: number): number => {
  if (zoom >= 16) return 2; // Мало тайлов при близком зуме
  if (zoom >= 14) return 3; // Стандартный радиус
  if (zoom >= 12) return 4; // Больше тайлов
  if (zoom >= 10) return 5; // Много тайлов
  return 6; // Максимум тайлов при далеком зуме
};

/**
 * Генерирует мок-данные hex-тайлов вокруг указанной локации
 */
export const generateMockHexTiles = (
  center: Location, 
  radius: number = 3, 
  resolution: number = H3_RESOLUTIONS.STREET
): HexTile[] => {
  try {
    const centerHex = latLngToCell(center.latitude, center.longitude, resolution);
    const hexIds = gridDisk(centerHex, radius);
    
    return hexIds.map((hexId, index) => {
      const coordinates = cellToLatLng(hexId);
      
      // Генерируем случайный статус владения
      const random = Math.random();
      let ownershipStatus: HexOwnershipStatus;
      if (random < 0.1) {
        ownershipStatus = 'owned'; // 10% - свои
      } else if (random < 0.3) {
        ownershipStatus = 'enemy'; // 20% - чужие
      } else {
        ownershipStatus = 'free'; // 70% - свободные
      }
      
      // Генерируем случайную цену на основе расстояния от центра
      const distanceFromCenter = gridDistance(centerHex, hexId);
      const basePrice = 100;
      const price = Math.floor(basePrice * (1 + distanceFromCenter * 0.2 + Math.random() * 0.5));
      
      return {
        h3Index: hexId,
        coordinates: { lat: coordinates[0], lng: coordinates[1] },
        ownershipStatus,
        price,
        owner: ownershipStatus === 'owned' ? 'current_player' : 
               ownershipStatus === 'enemy' ? `player_${Math.floor(Math.random() * 1000)}` : null,
        lastUpdated: Date.now() - Math.floor(Math.random() * 86400000), // Случайное время в последние 24 часа
        level: ownershipStatus !== 'free' ? Math.floor(Math.random() * 5) + 1 : undefined,
        resources: ownershipStatus !== 'free' ? {
          oil: Math.floor(Math.random() * 100),
          gas: Math.floor(Math.random() * 100),
          gold: Math.floor(Math.random() * 50),
          silver: Math.floor(Math.random() * 75),
          stone: Math.floor(Math.random() * 200),
          wood: Math.floor(Math.random() * 150)
        } : undefined
      };
    });
  } catch (error) {
    console.error('Ошибка при генерации мок-данных hex-тайлов:', error);
    return [];
  }
};

/**
 * Вычисляет общую стоимость массовой покупки (37 тайлов)
 */
export const calculateBulkPurchaseCost = (
  centerHex: string, 
  radius: number = 3,
  hexTiles: HexTile[]
): { totalCost: number; hexIds: string[]; availableHexes: string[] } => {
  try {
    const hexIds = gridDisk(centerHex, radius);
    const availableHexes: string[] = [];
    let totalCost = 0;
    
    hexIds.forEach(hexId => {
      const hexTile = hexTiles.find(tile => tile.h3Index === hexId);
      if (hexTile && hexTile.ownershipStatus === 'free') {
        availableHexes.push(hexId);
        totalCost += hexTile.price;
      }
    });
    
    return {
      totalCost,
      hexIds,
      availableHexes
    };
  } catch (error) {
    console.error('Ошибка при вычислении стоимости массовой покупки:', error);
    return {
      totalCost: 0,
      hexIds: [],
      availableHexes: []
    };
  }
};

/**
 * Проверяет, находится ли hex в пределах заданного расстояния от центра
 */
export const isHexWithinDistance = (
  targetHex: string, 
  centerHex: string, 
  maxDistance: number
): boolean => {
  try {
    if (!isValidCell(targetHex) || !isValidCell(centerHex)) {
      return false;
    }
    return gridDistance(centerHex, targetHex) <= maxDistance;
  } catch (error) {
    console.error('Ошибка при проверке расстояния между hex-ами:', error);
    return false;
  }
};

/**
 * Конвертирует H3 индекс в человекочитаемые координаты
 */
export const formatHexCoordinates = (h3Index: string): string => {
  try {
    const [lat, lng] = cellToLatLng(h3Index);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Ошибка при форматировании координат hex-а:', error);
    return 'Неизвестные координаты';
  }
};

/**
 * Получает соседние hex-ы для заданного hex-а
 */
export const getNeighborHexes = (h3Index: string, radius: number = 1): string[] => {
  try {
    if (!isValidCell(h3Index)) {
      return [];
    }
    return gridDisk(h3Index, radius).filter(hex => hex !== h3Index);
  } catch (error) {
    console.error('Ошибка при получении соседних hex-ов:', error);
    return [];
  }
};

/**
 * Фильтрует hex-тайлы по статусу владения
 */
export const filterHexesByOwnership = (
  hexTiles: HexTile[], 
  status: HexOwnershipStatus
): HexTile[] => {
  return hexTiles.filter(tile => tile.ownershipStatus === status);
};

/**
 * Находит ближайший свободный hex к заданной позиции
 */
export const findNearestFreeHex = (
  center: Location, 
  hexTiles: HexTile[], 
  resolution: number = H3_RESOLUTIONS.STREET
): HexTile | null => {
  try {
    const centerHex = latLngToCell(center.latitude, center.longitude, resolution);
    const freeHexes = filterHexesByOwnership(hexTiles, 'free');
    
    if (freeHexes.length === 0) {
      return null;
    }
    
    let nearestHex = freeHexes[0];
    let minDistance = gridDistance(centerHex, nearestHex.h3Index);
    
    freeHexes.forEach(hex => {
      const distance = gridDistance(centerHex, hex.h3Index);
      if (distance < minDistance) {
        minDistance = distance;
        nearestHex = hex;
      }
    });
    
    return nearestHex;
  } catch (error) {
    console.error('Ошибка при поиске ближайшего свободного hex-а:', error);
    return null;
  }
};