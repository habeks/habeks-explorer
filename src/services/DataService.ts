import { HexTile } from '../types/hex';
import { Location } from '../types';

/**
 * Интерфейс для пользовательских данных
 */
interface UserData {
  id: string;
  nickname: string;
  email: string;
  balance: {
    tokens: number;
    shards: number;
    orbs: number;
  };
  ownedHexes: string[];
  level: number;
  experience: number;
  achievements: string[];
  lastLogin: string;
}

/**
 * Интерфейс для региональных данных hex-тайлов
 */
interface RegionData {
  region: string;
  center: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: string;
  tiles: HexTile[];
}

/**
 * Централизованный сервис для управления всеми данными приложения
 * Абстрагирует источники данных и предоставляет единый API
 */
class DataService {
  private static instance: DataService;
  private hexCache: Map<string, RegionData> = new Map();
  private userCache: UserData | null = null;
  private readonly baseUrl = '/data';

  private constructor() {}

  /**
   * Singleton pattern для обеспечения единого экземпляра сервиса
   */
  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

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
   * Загружает hex-тайлы для указанной локации из реальных JSON данных
   */
  public async loadHexTiles(location: Location): Promise<HexTile[]> {
    const region = this.getRegionByCoordinates(location.latitude, location.longitude);
    
    // Проверяем кэш
    if (this.hexCache.has(region)) {
      const cachedData = this.hexCache.get(region)!;
      console.log(`✅ Hex-тайлы загружены из кэша для региона: ${region}`);
      return cachedData.tiles;
    }

    try {
      console.log(`🔄 Загрузка hex-тайлов из реальных данных...`);
      
      // Загружаем hex-тайлы из нового JSON файла
      const response = await fetch(`${this.baseUrl}/hex-tiles.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Валидация данных
      if (!data.tiles || !Array.isArray(data.tiles)) {
        throw new Error('Некорректный формат данных hex-тайлов');
      }
      
      // Преобразуем в формат RegionData
      const regionData: RegionData = {
        region: region,
        center: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        lastUpdated: data.metadata?.lastSynced || new Date().toISOString(),
        tiles: data.tiles.map((tile: any) => ({
          h3Index: tile.h3Index,
          coordinates: tile.coordinates as [number, number],
          ownershipStatus: tile.ownershipStatus,
          price: tile.price,
          owner: tile.owner,
          resources: tile.resources,
          lastUpdated: new Date(tile.lastUpdated).getTime()
        }))
      };
      
      // Сохраняем в кэш
      this.hexCache.set(region, regionData);
      
      console.log(`✅ Успешно загружено ${regionData.tiles.length} hex-тайлов из реальных данных`);
      
      return regionData.tiles;
    } catch (error) {
      console.error('❌ Ошибка при загрузке hex-тайлов:', error);
      
      // Fallback: генерируем минимальные тестовые данные
      const fallbackTiles = this.generateFallbackHexTiles(location);
      console.log('⚠️ Используем fallback hex-тайлы');
      return fallbackTiles;
    }
  }

  /**
   * Загружает данные пользователя из реального JSON файла
   */
  public async loadUserData(): Promise<UserData | null> {
    // Проверяем кэш
    if (this.userCache) {
      console.log('✅ Данные пользователя загружены из кэша');
      return this.userCache;
    }

    try {
      console.log('🔄 Загрузка данных пользователя из реальных данных...');
      
      const response = await fetch(`${this.baseUrl}/demo-player.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Преобразуем в формат UserData
      const userData: UserData = {
        id: data.player.id,
        nickname: data.player.nickname,
        email: data.player.email,
        balance: {
          tokens: data.currency.tokens,
          shards: data.currency.shards,
          orbs: data.currency.orbs
        },
        ownedHexes: data.ownedHexes || [],
        level: data.player.level,
        experience: data.player.experience,
        achievements: data.achievements?.map((a: any) => a.id) || [],
        lastLogin: data.player.lastActive
      };
      
      // Валидация данных
      if (!userData.id || !userData.nickname) {
        throw new Error('Некорректный формат пользовательских данных');
      }
      
      // Сохраняем в кэш
      this.userCache = userData;
      
      console.log(`✅ Данные пользователя ${userData.nickname} успешно загружены из реальных данных`);
      
      return userData;
    } catch (error) {
      console.error('❌ Ошибка при загрузке данных пользователя:', error);
      return null;
    }
  }

  /**
   * Получает информацию о регионе
   */
  public async getRegionInfo(location: Location): Promise<{ region: string; center: { latitude: number; longitude: number } } | null> {
    const region = this.getRegionByCoordinates(location.latitude, location.longitude);
    
    try {
      const response = await fetch(`${this.baseUrl}/hex-tiles-${region}.json`);
      
      if (!response.ok) {
        return null;
      }
      
      const data: RegionData = await response.json();
      
      return {
        region: data.region,
        center: data.center
      };
    } catch (error) {
      console.error('❌ Ошибка при получении информации о регионе:', error);
      return null;
    }
  }

  /**
   * Обновляет статус владения hex-тайлом (имитация API)
   */
  public async updateHexOwnership(hexId: string, newOwner: string | null, region?: string): Promise<boolean> {
    try {
      console.log(`🔄 Обновление владения hex-тайлом ${hexId}...`);
      
      // Имитируем задержку сетевого запроса
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Ищем и обновляем данные в кэше
      for (const [cachedRegion, data] of this.hexCache.entries()) {
        const hexIndex = data.tiles.findIndex(tile => tile.h3Index === hexId);
        if (hexIndex !== -1) {
          data.tiles[hexIndex].owner = newOwner;
          data.tiles[hexIndex].ownershipStatus = newOwner ? 'owned' : 'free';
          data.tiles[hexIndex].lastUpdated = Date.now();
          data.lastUpdated = new Date().toISOString();
          
          console.log(`✅ Владение hex-тайлом ${hexId} обновлено`);
          return true;
        }
      }
      
      console.warn(`⚠️ Hex-тайл ${hexId} не найден в кэше`);
      return false;
    } catch (error) {
      console.error('❌ Ошибка при обновлении владения hex-тайлом:', error);
      return false;
    }
  }

  /**
   * Обновляет баланс пользователя (имитация API)
   */
  public async updateUserBalance(balanceChanges: Partial<UserData['balance']>): Promise<boolean> {
    try {
      if (!this.userCache) {
        throw new Error('Данные пользователя не загружены');
      }
      
      console.log('🔄 Обновление баланса пользователя...');
      
      // Имитируем задержку сетевого запроса
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Обновляем баланс
      this.userCache.balance = {
        ...this.userCache.balance,
        ...balanceChanges
      };
      
      console.log('✅ Баланс пользователя обновлен');
      return true;
    } catch (error) {
      console.error('❌ Ошибка при обновлении баланса:', error);
      return false;
    }
  }

  /**
   * Очищает весь кэш
   */
  public clearCache(): void {
    this.hexCache.clear();
    this.userCache = null;
    console.log('🗑️ Весь кэш данных очищен');
  }

  /**
   * Очищает кэш hex-тайлов для определенного региона
   */
  public clearRegionCache(region: string): void {
    this.hexCache.delete(region);
    console.log(`🗑️ Кэш hex-тайлов для региона ${region} очищен`);
  }

  /**
   * Получает статистику по загруженным данным
   */
  public getCacheStats(): { regions: { [region: string]: number }, userLoaded: boolean } {
    const regions: { [region: string]: number } = {};
    
    this.hexCache.forEach((data, region) => {
      regions[region] = data.tiles.length;
    });
    
    return {
      regions,
      userLoaded: this.userCache !== null
    };
  }

  /**
   * Генерирует fallback hex-тайлы если основные данные недоступны
   */
  private generateFallbackHexTiles(location: Location): HexTile[] {
    const tiles: HexTile[] = [];
    const count = 5;
    
    for (let i = 0; i < count; i++) {
      const offsetLat = (Math.random() - 0.5) * 0.01; // ±0.005 градуса
      const offsetLng = (Math.random() - 0.5) * 0.01;
      
      tiles.push({
        h3Index: `fallback_${Date.now()}_${i}`,
        coordinates: {
          lat: location.latitude + offsetLat,
          lng: location.longitude + offsetLng
        },
        ownershipStatus: i % 3 === 0 ? 'owned' : i % 3 === 1 ? 'free' : 'enemy',
        price: 1000 + Math.floor(Math.random() * 1000),
        owner: i % 3 === 0 ? 'demo_player_123' : i % 3 === 2 ? 'rival_corp' : null,
        resources: {
          oil: Math.floor(Math.random() * 50),
          gas: Math.floor(Math.random() * 30),
          gold: Math.floor(Math.random() * 10),
          stone: Math.floor(Math.random() * 100)
        },
        lastUpdated: Date.now()
      });
    }
    
    return tiles;
  }

  /**
   * Загружает игровую конфигурацию
   */
  public async loadGameConfig(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/game-config.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const config = await response.json();
      console.log('✅ Игровая конфигурация загружена');
      return config;
    } catch (error) {
      console.error('❌ Ошибка при загрузке конфигурации:', error);
      return null;
    }
  }

  /**
   * Загружает AR предметы
   */
  public async loadARItems(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ar-items.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`✅ Загружено ${data.items?.length || 0} AR предметов`);
      return data.items || [];
    } catch (error) {
      console.error('❌ Ошибка при загрузке AR предметов:', error);
      return [];
    }
  }

  /**
   * Предзагрузка всех данных для улучшения производительности
   */
  public async preloadData(location: Location): Promise<void> {
    try {
      console.log('🚀 Предзагрузка всех данных...');
      
      // Загружаем все данные параллельно
      const [hexTiles, userData, gameConfig, arItems] = await Promise.all([
        this.loadHexTiles(location),
        this.loadUserData(),
        this.loadGameConfig(),
        this.loadARItems()
      ]);
      
      console.log('✅ Предзагрузка всех данных завершена');
    } catch (error) {
      console.error('❌ Ошибка при предзагрузке данных:', error);
    }
  }
}

// Создаем и экспортируем singleton экземпляр
export const dataService = DataService.getInstance();
export type { UserData, RegionData };
export default DataService;