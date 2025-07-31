import { useState, useEffect, useCallback } from 'react';
import { Location } from '../types';
import { geolocationService } from '../services/geolocation';

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export interface UseGeolocationReturn {
  location: Location | null;
  accuracy: 'high' | 'medium' | 'low' | null;
  isLoading: boolean;
  error: string | null;
  getCurrentPosition: () => Promise<void>;
  startWatching: () => void;
  stopWatching: () => void;
  isSupported: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}): UseGeolocationReturn => {
  const {
    enableHighAccuracy = true,
    watch = false
  } = options;

  const [location, setLocation] = useState<Location | null>(null);
  const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  // Получение текущего местоположения
  const getCurrentPosition = useCallback(async () => {
    if (!geolocationService.isSupported()) {
      setError('Геолокация не поддерживается');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newLocation = await geolocationService.getCurrentPosition(enableHighAccuracy);
      setLocation(newLocation);
      setAccuracy(geolocationService.getAccuracyLevel(newLocation.accuracy));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка получения местоположения';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [enableHighAccuracy]);

  // Начало отслеживания
  const startWatching = useCallback(() => {
    if (!geolocationService.isSupported()) {
      setError('Геолокация не поддерживается');
      return;
    }

    try {
      geolocationService.startWatching(enableHighAccuracy);
      setIsWatching(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка отслеживания';
      setError(errorMessage);
    }
  }, [enableHighAccuracy]);

  // Остановка отслеживания
  const stopWatching = useCallback(() => {
    geolocationService.stopWatching();
    setIsWatching(false);
  }, []);

  // Подписка на обновления
  useEffect(() => {
    const unsubscribe = geolocationService.subscribe((newLocation) => {
      setLocation(newLocation);
      setAccuracy(geolocationService.getAccuracyLevel(newLocation.accuracy));
    });

    const unsubscribeErrors = geolocationService.subscribeToErrors((error) => {
      setError(error.message);
    });

    return () => {
      unsubscribe();
      unsubscribeErrors();
    };
  }, []);

  // Автоматическое отслеживание
  useEffect(() => {
    if (watch && !isWatching) {
      startWatching();
    }

    return () => {
      if (isWatching) {
        stopWatching();
      }
    };
  }, [watch, isWatching, startWatching, stopWatching]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (isWatching) {
        geolocationService.stopWatching();
      }
    };
  }, [isWatching]);

  return {
    location,
    accuracy,
    isLoading,
    error,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isSupported: geolocationService.isSupported()
  };
};