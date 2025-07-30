import React from 'react';
import { MapIcon, PlusIcon, MinusIcon, TargetIcon } from '../Icons';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  onToggleHexGrid: () => void;
  showHexGrid: boolean;
  zoom: number;
  maxZoom?: number;
  minZoom?: number;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onRecenter,
  onToggleHexGrid,
  showHexGrid,
  zoom,
  maxZoom = 18,
  minZoom = 6
}) => {
  return (
    <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
      {/* Контролы зума */}
      <div className="flex flex-col bg-dark-primary bg-opacity-90 border border-accent-primary rounded-lg shadow-neon backdrop-blur-sm">
        <button
          onClick={onZoomIn}
          disabled={zoom >= maxZoom}
          className="p-3 text-text-primary hover:text-accent-primary hover:bg-accent-primary hover:bg-opacity-20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-t-lg"
          title="Увеличить масштаб"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
        
        <div className="px-3 py-1 text-center text-xs text-text-secondary font-mono border-t border-accent-primary border-opacity-30">
          {zoom.toFixed(1)}
        </div>
        
        <button
          onClick={onZoomOut}
          disabled={zoom <= minZoom}
          className="p-3 text-text-primary hover:text-accent-primary hover:bg-accent-primary hover:bg-opacity-20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-b-lg"
          title="Уменьшить масштаб"
        >
          <MinusIcon className="w-5 h-5" />
        </button>
      </div>
      
      {/* Кнопка центрирования */}
      <button
        onClick={onRecenter}
        className="p-3 bg-dark-primary bg-opacity-90 border border-accent-primary rounded-lg shadow-neon backdrop-blur-sm text-text-primary hover:text-accent-primary hover:bg-accent-primary hover:bg-opacity-20 transition-all duration-300"
        title="Центрировать на моей позиции"
      >
        <TargetIcon className="w-5 h-5" />
      </button>
      
      {/* Переключатель hex-сетки */}
      <button
        onClick={onToggleHexGrid}
        className={`p-3 bg-dark-primary bg-opacity-90 border border-accent-primary rounded-lg shadow-neon backdrop-blur-sm transition-all duration-300 ${
          showHexGrid 
            ? 'text-accent-primary bg-accent-primary bg-opacity-20' 
            : 'text-text-primary hover:text-accent-primary hover:bg-accent-primary hover:bg-opacity-20'
        }`}
        title={showHexGrid ? 'Скрыть гексагональную сетку' : 'Показать гексагональную сетку'}
      >
        <MapIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MapControls;