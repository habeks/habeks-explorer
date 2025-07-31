import { useState, useEffect, useCallback } from 'react';
import { HexTile } from '../types/hex';
import { Location } from '../types';
import { dataService } from '../services/DataService';

/**
 * Хук для управления hex-тайлами с синхронизацией через DataService
 * Обеспечивает единый источник данных для всех компонентов
 */
export const useHexTiles = (location: Location | null) => {
  const [hexTiles, setHexTiles] = useState<HexTile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedLocation, setLastLoadedLocation] = useState<Location | null>(null);

  // Функция загрузки hex-тайлов
  const loadHexTiles = useCallback(async (targetLocation: Location) => {
    // Проверяем, нужно ли перезагружать данные
    if (lastLoadedLocation && 
        Math.abs(lastLoadedLocation.latitude - targetLocation.latitude) < 0.01 &&
        Math.abs(lastLoadedLocation.longitude - targetLocation.longitude) < 0.01) {
      console.log('📍 Данные уже загружены для этой локации');
      return hexTiles;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Загрузка hex-тайлов через useHexTiles...');
      
      const tiles = await dataService.loadHexTiles(targetLocation);
      
      setHexTiles(tiles);
      setLastLoadedLocation(targetLocation);
      
      console.log(`✅ Загружено ${tiles.length} hex-тайлов через useHexTiles`);
      return tiles;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      console.error('❌ Ошибка загрузки hex-тайлов:', err);
      setError(errorMessage);
      setHexTiles([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [lastLoadedLocation, hexTiles]);

  // Автоматическая загрузка при изменении локации
  useEffect(() => {
    if (location) {
      loadHexTiles(location);
    }
  }, [location, loadHexTiles]);

  // Обновление статуса владения hex-тайлом
  const updateHexOwnership = useCallback(async (hexId: string, newOwner: string | null) => {
    try {
      console.log(`🔄 Обновление владения hex-тайлом ${hexId}...`);
      
      // Обновляем в DataService
      const success = await dataService.updateHexOwnership(hexId, newOwner);
      
      if (success) {
        // Обновляем локальное состояние
        setHexTiles(prevTiles => 
          prevTiles.map(tile => {
            if (tile.h3Index === hexId) {
              return {
                ...tile,
                owner: newOwner,
                ownershipStatus: newOwner ? 'owned' : 'free',
                lastUpdated: Date.now()
              };
            }
            return tile;
          })
        );
        
        console.log(`✅ Владение hex-тайлом ${hexId} обновлено`);
        return true;
      } else {
        throw new Error('Не удалось обновить владение в DataService');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления владения';
      console.error('❌ Ошибка обновления владения hex-тайлом:', err);
      setError(errorMessage);
      return false;
    }
  }, []);

  // Массовое обновление владения
  const updateMultipleHexOwnership = useCallback(async (hexIds: string[], newOwner: string | null) => {
    try {
      console.log(`🔄 Массовое обновление владения ${hexIds.length} hex-тайлов...`);
      
      const promises = hexIds.map(hexId => dataService.updateHexOwnership(hexId, newOwner));
      const results = await Promise.all(promises);
      
      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        // Обновляем локальное состояние для успешно обновленных тайлов
        const successfulHexIds = hexIds.filter((_, index) => results[index]);
        
        setHexTiles(prevTiles => 
          prevTiles.map(tile => {
            if (successfulHexIds.includes(tile.h3Index)) {
              return {
                ...tile,
                owner: newOwner,
                ownershipStatus: newOwner ? 'owned' : 'free',
                lastUpdated: Date.now()
              };
            }
            return tile;
          })
        );
        
        console.log(`✅ Владение обновлено для ${successCount} из ${hexIds.length} hex-тайлов`);
      }
      
      return successCount;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка массового обновления владения';
      console.error('❌ Ошибка массового обновления владения:', err);
      setError(errorMessage);
      return 0;
    }
  }, []);

  // Получение hex-тайла по ID
  const getHexById = useCallback((hexId: string): HexTile | undefined => {
    return hexTiles.find(tile => tile.h3Index === hexId);
  }, [hexTiles]);

  // Получение статистики по hex-тайлам
  const getHexStats = useCallback(() => {
    const owned = hexTiles.filter(h => h.ownershipStatus === 'owned').length;
    const free = hexTiles.filter(h => h.ownershipStatus === 'free').length;
    const enemy = hexTiles.filter(h => h.ownershipStatus === 'enemy').length;
    const total = hexTiles.length;
    
    return { owned, free, enemy, total };
  }, [hexTiles]);

  // Принудительная перезагрузка данных
  const refresh = useCallback(() => {
    if (lastLoadedLocation) {
      setLastLoadedLocation(null); // Сбрасываем кэш
      loadHexTiles(lastLoadedLocation);
    }
  }, [lastLoadedLocation, loadHexTiles]);

  // Очистка ошибки
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    hexTiles,
    isLoading,
    error,
    loadHexTiles,
    updateHexOwnership,
    updateMultipleHexOwnership,
    getHexById,
    getHexStats,
    refresh,
    clearError
  };
};

export default useHexTiles;