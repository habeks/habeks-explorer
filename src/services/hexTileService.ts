import { HexTile } from '../types/hex';
import { Location } from '../types';

interface HexTileData {
  region: string;
  center: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: string;
  tiles: HexTile[];
}

/**
 * Сервис для загрузки данных hex-тайлов из статических JSON файлов
 * Имитирует реальные API-запросы
 */
class HexTileService {
  private cache: Map<string, HexTileData> = new Map();
  private readonly baseUrl = '/habeks-explorer/data';

  /**
   * Определяет регион на основе координат
   */
  private getRegionByCoordinates(latitude: number, longitude: number): string {
    // Москва: широта ~55.7, долгота ~37.6
    if (latitude >= 55.0 && latitude <= 56.5 && longitude >= 36.0 && longitude <= 39.0) {
      return 'moscow';
    }
    
    // Лондон: широта ~51.5, долгота ~-0.1
    if (latitude >= 51.0 && latitude <= 52.0 && longitude >= -1.0 && longitude <= 1.0) {
      return 'london';
    }
    
    // По умолчанию возвращаем Москву
    return 'moscow';
  }

  /**
   * Загружает данные hex-тайлов для указанной локации
   */
  async loadHexTilesForLocation(location: Location): Promise<HexTile[]> {
    const region = this.getRegionByCoordinates(location.latitude, location.longitude);
    
    // Проверяем кэш
    if (this.cache.has(region)) {
      const cachedData = this.cache.get(region)!;
      console.log(`Загружены hex-тайлы из кэша для региона: ${region}`);
      return cachedData.tiles;
    }

    try {
      console.log(`Загрузка hex-тайлов для региона: ${region}`);
      
      const response = await fetch(`${this.baseUrl}/hex-tiles-${region}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: HexTileData = await response.json();
      
      // Сохраняем в кэш
      this.cache.set(region, data);
      
      console.log(`Успешно загружено ${data.tiles.length} hex-тайлов для региона ${region}`);
      
      return data.tiles;
    } catch (error) {
      console.error('Ошибка при загрузке hex-тайлов:', error);
      
      // Возвращаем пустой массив в случае ошибки
      return [];
    }
  }

  /**
   * Получает информацию о регионе
   */
  async getRegionInfo(location: Location): Promise<{ region: string; center: { latitude: number; longitude: number } } | null> {
    const region = this.getRegionByCoordinates(location.latitude, location.longitude);
    
    try {
      const response = await fetch(`${this.baseUrl}/hex-tiles-${region}.json`);
      
      if (!response.ok) {
        return null;
      }
      
      const data: HexTileData = await response.json();
      
      return {
        region: data.region,
        center: data.center
      };
    } catch (error) {
      console.error('Ошибка при получении информации о регионе:', error);
      return null;
    }
  }

  /**
   * Сохраняет изменения в hex-тайлах (имитация)
   * В реальном приложении это был бы API-запрос на сервер
   */
  async saveHexTileChanges(tiles: HexTile[], region: string): Promise<boolean> {
    try {
      console.log(`Сохранение изменений для ${tiles.length} hex-тайлов в регионе ${region}`);
      
      // Имитируем задержку сетевого запроса
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Обновляем кэш
      if (this.cache.has(region)) {
        const cachedData = this.cache.get(region)!;
        cachedData.tiles = tiles;
        cachedData.lastUpdated = new Date().toISOString();
      }
      
      console.log('Изменения успешно сохранены');
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении изменений:', error);
      return false;
    }
  }

  /**
   * Очищает кэш
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Кэш hex-тайлов очищен');
  }

  /**
   * Получает статистику по загруженным регионам
   */
  getCacheStats(): { [region: string]: number } {
    const stats: { [region: string]: number } = {};
    
    this.cache.forEach((data, region) => {
      stats[region] = data.tiles.length;
    });
    
    return stats;
  }
}

// Экспортируем singleton экземпляр
export const hexTileService = new HexTileService();
export type { HexTileData };