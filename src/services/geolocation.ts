import { Location } from '../types';

// Опции для высокоточного позиционирования
const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 30000 // 30 секунд
};

// Опции для обычного позиционирования
const STANDARD_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 60000 // 1 минута
};

// Класс для работы с геолокацией
class GeolocationService {
  private watchId: number | null = null;
  private lastKnownLocation: Location | null = null;
  private callbacks: Array<(location: Location) => void> = [];
  private errorCallbacks: Array<(error: GeolocationPositionError) => void> = [];

  // Проверка поддержки геолокации
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Получение текущего местоположения
  async getCurrentPosition(highAccuracy: boolean = true): Promise<Location> {
    if (!this.isSupported()) {
      throw new Error('Геолокация не поддерживается');
    }

    return new Promise((resolve, reject) => {
      const options = highAccuracy ? HIGH_ACCURACY_OPTIONS : STANDARD_OPTIONS;
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          
          this.lastKnownLocation = location;
          resolve(location);
        },
        (error) => {
          console.error('Ошибка получения геолокации:', error);
          reject(this.handleGeolocationError(error));
        },
        options
      );
    });
  }

  // Начало отслеживания местоположения
  startWatching(highAccuracy: boolean = true): void {
    if (!this.isSupported()) {
      throw new Error('Геолокация не поддерживается');
    }

    if (this.watchId !== null) {
      this.stopWatching();
    }

    const options = highAccuracy ? HIGH_ACCURACY_OPTIONS : STANDARD_OPTIONS;
    
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        
        this.lastKnownLocation = location;
        this.notifyCallbacks(location);
      },
      (error) => {
        console.error('Ошибка отслеживания геолокации:', error);
        this.notifyErrorCallbacks(error);
      },
      options
    );
  }

  // Остановка отслеживания
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Подписка на обновления местоположения
  subscribe(callback: (location: Location) => void): () => void {
    this.callbacks.push(callback);
    
    // Возвращаем функцию отписки
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  // Подписка на ошибки
  subscribeToErrors(callback: (error: GeolocationPositionError) => void): () => void {
    this.errorCallbacks.push(callback);
    
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
    };
  }

  // Получение последнего известного местоположения
  getLastKnownLocation(): Location | null {
    return this.lastKnownLocation;
  }

  // Оценка точности местоположения
  getAccuracyLevel(accuracy: number): 'high' | 'medium' | 'low' {
    if (accuracy <= 10) return 'high';    // Меньше 10 метров
    if (accuracy <= 50) return 'medium';  // Меньше 50 метров
    return 'low';                         // Больше 50 метров
  }

  // Проверка старости данных
  isLocationFresh(location: Location, maxAgeSeconds: number = 60): boolean {
    const now = Date.now();
    const ageSeconds = (now - location.timestamp) / 1000;
    return ageSeconds <= maxAgeSeconds;
  }

  // Вычисление расстояния между двумя точками
  calculateDistance(location1: Location, location2: Location): number {
    const R = 6371000; // Радиус Земли в метрах
    const dLat = (location2.latitude - location1.latitude) * Math.PI / 180;
    const dLng = (location2.longitude - location1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(location1.latitude * Math.PI / 180) * 
      Math.cos(location2.latitude * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Проверка, находится ли точка в радиусе
  isWithinRadius(center: Location, point: Location, radiusMeters: number): boolean {
    const distance = this.calculateDistance(center, point);
    return distance <= radiusMeters;
  }

  // Оценка скорости перемещения
  calculateSpeed(location1: Location, location2: Location): number {
    const distance = this.calculateDistance(location1, location2);
    const timeSeconds = (location2.timestamp - location1.timestamp) / 1000;
    
    if (timeSeconds <= 0) return 0;
    
    return distance / timeSeconds; // метры в секунду
  }

  // Проверка на подозрительное перемещение (базовая защита от спуфинга)
  isSuspiciousMovement(location1: Location, location2: Location): boolean {
    const speed = this.calculateSpeed(location1, location2);
    const maxReasonableSpeed = 100; // 100 м/с (360 км/ч) - максимальная разумная скорость
    
    return speed > maxReasonableSpeed;
  }

  // Обработка ошибок геолокации
  private handleGeolocationError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Доступ к геолокации запрещен. Пожалуйста, разрешите доступ в настройках браузера.');
      case error.POSITION_UNAVAILABLE:
        return new Error('Местоположение недоступно. Проверьте подключение к сети и GPS.');
      case error.TIMEOUT:
        return new Error('Превышено время ожидания получения местоположения. Попробуйте еще раз.');
      default:
        return new Error('Неизвестная ошибка при получении местоположения.');
    }
  }

  // Уведомление подписчиков об обновлении
  private notifyCallbacks(location: Location): void {
    this.callbacks.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Ошибка в callback геолокации:', error);
      }
    });
  }

  // Уведомление об ошибках
  private notifyErrorCallbacks(error: GeolocationPositionError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Ошибка в error callback геолокации:', callbackError);
      }
    });
  }

  // Очистка ресурсов
  destroy(): void {
    this.stopWatching();
    this.callbacks = [];
    this.errorCallbacks = [];
    this.lastKnownLocation = null;
  }
}

// Экспорт синглтона
export const geolocationService = new GeolocationService();
export default geolocationService;