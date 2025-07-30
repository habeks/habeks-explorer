import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Location } from '../../types';
import { HexGrid } from './HexGrid';

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  location?: Location | null;
  onMapLoad?: (map: maplibregl.Map) => void;
  onMapClick?: (event: maplibregl.MapMouseEvent) => void;
  showHexGrid?: boolean;
  children?: React.ReactNode;
}

export const MapView: React.FC<MapViewProps> = ({
  center = { lat: 55.7558, lng: 37.6173 }, // Москва по умолчанию
  zoom = 12,
  location,
  onMapLoad,
  onMapClick,
  showHexGrid = true,
  children
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return; // Карта уже инициализирована

    if (!mapContainer.current) return;

    // ИСПРАВЛЕННАЯ инициализация карты MapLibre GL JS с простым стилем
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://demotiles.maplibre.org/style.json', // Простой рабочий стиль
        center: [center.lng, center.lat],
        zoom: zoom,
        attributionControl: false
      });

      console.log('✅ MapLibre карта инициализирована успешно');
    } catch (error) {
      console.error('❌ Ошибка инициализации MapLibre:', error);
      return;
    }

    // Добавление контролов навигации
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-right');

      // Обработчик загрузки карты
      map.current.on('load', () => {
        console.log('✅ Карта загружена успешно');
        setMapLoaded(true);
        
        if (onMapLoad && map.current) {
          onMapLoad(map.current);
        }
        
        // Применяем темную тему после загрузки
        if (map.current && map.current.getCanvas) {
          const canvas = map.current.getCanvas();
          if (canvas) {
            canvas.style.filter = 'brightness(0.6) contrast(1.2) saturate(0.8)';
            console.log('✅ Киберпанк тема применена');
          }
        }
      });

      // Обработчик кликов по карте
      if (onMapClick) {
        map.current.on('click', onMapClick);
      }

    // Cleanup при размонтировании компонента
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Обновление центра карты при изменении локации
  useEffect(() => {
    if (map.current && location) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        duration: 2000
      });
    }
  }, [location]);

  // Добавление маркера пользователя
  useEffect(() => {
    if (map.current && location && mapLoaded) {
      // Удаление предыдущего маркера
      const existingMarker = document.querySelector('.user-location-marker');
      if (existingMarker) {
        existingMarker.remove();
      }

      // Создание кастомного маркера
      const markerElement = document.createElement('div');
      markerElement.className = 'user-location-marker';
      markerElement.innerHTML = `
        <div class="relative w-6 h-6">
          <div class="absolute inset-0 bg-accent-primary rounded-full animate-ping opacity-75"></div>
          <div class="absolute inset-0 bg-accent-primary rounded-full border-2 border-white shadow-neon"></div>
        </div>
      `;

      new maplibregl.Marker(markerElement)
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);
    }
  }, [location, mapLoaded]);

  return (
    <div className="relative w-full h-full cyberpunk-map">
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-lg overflow-hidden shadow-neon"
        style={{ minHeight: '400px' }}
      />
      
      {/* Overlay для HexGrid и других children */}
      {showHexGrid && mapLoaded && map.current && (
        <HexGrid 
          map={map.current}
          center={location ? { lat: location.latitude, lng: location.longitude } : center}
        />
      )}
      
      {/* Отображаем children */}
      {children}
      
      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-primary bg-opacity-75 rounded-lg">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full"></div>
            <p className="text-text-primary text-sm font-mono">Загрузка карты...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;