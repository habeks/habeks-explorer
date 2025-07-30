import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { HexTile, HexOwnershipStatus } from '../types/hex';
import { Location, Currency } from '../types';
import { hexTileService } from '../services/hexTileService';
import { calculateBulkPurchaseCost } from '../utils/hexUtils';

// Типы для состояния карты
interface MapState {
  hexTiles: HexTile[];
  selectedHexes: Set<string>;
  currentZoom: number;
  mapCenter: { lat: number; lng: number };
  showHexGrid: boolean;
  isLoading: boolean;
  bulkPurchaseMode: boolean;
  totalPurchaseCost: number;
  region: string | null;
}

// Типы действий
type MapAction =
  | { type: 'SET_HEX_TILES'; payload: HexTile[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_CENTER'; payload: { lat: number; lng: number } }
  | { type: 'SET_SHOW_HEX_GRID'; payload: boolean }
  | { type: 'TOGGLE_HEX_SELECTION'; payload: string }
  | { type: 'SET_SELECTED_HEXES'; payload: Set<string> }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_BULK_PURCHASE_MODE'; payload: boolean }
  | { type: 'UPDATE_HEX_OWNERSHIP'; payload: { hexIds: string[]; owner: string } }
  | { type: 'SET_REGION'; payload: string }
  | { type: 'CALCULATE_TOTAL_COST'; payload: { hexTiles: HexTile[]; selectedHexes: Set<string> } };

// Начальное состояние
const initialState: MapState = {
  hexTiles: [],
  selectedHexes: new Set(),
  currentZoom: 12,
  mapCenter: { lat: 55.7558, lng: 37.6173 }, // Москва по умолчанию
  showHexGrid: true,
  isLoading: false,
  bulkPurchaseMode: false,
  totalPurchaseCost: 0,
  region: null
};

// Reducer для управления состоянием
function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'SET_HEX_TILES':
      return { ...state, hexTiles: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ZOOM':
      return { ...state, currentZoom: action.payload };
    
    case 'SET_CENTER':
      return { ...state, mapCenter: action.payload };
    
    case 'SET_SHOW_HEX_GRID':
      return { ...state, showHexGrid: action.payload };
    
    case 'TOGGLE_HEX_SELECTION': {
      const newSelected = new Set(state.selectedHexes);
      if (newSelected.has(action.payload)) {
        newSelected.delete(action.payload);
      } else {
        newSelected.add(action.payload);
      }
      
      // Пересчитываем стоимость
      const cost = Array.from(newSelected).reduce((total, hexId) => {
        const hex = state.hexTiles.find(h => h.h3Index === hexId);
        return total + (hex?.price || 0);
      }, 0);
      
      return { 
        ...state, 
        selectedHexes: newSelected,
        totalPurchaseCost: cost
      };
    }
    
    case 'SET_SELECTED_HEXES': {
      const cost = Array.from(action.payload).reduce((total, hexId) => {
        const hex = state.hexTiles.find(h => h.h3Index === hexId);
        return total + (hex?.price || 0);
      }, 0);
      
      return { 
        ...state, 
        selectedHexes: action.payload,
        totalPurchaseCost: cost
      };
    }
    
    case 'CLEAR_SELECTION':
      return { 
        ...state, 
        selectedHexes: new Set(),
        totalPurchaseCost: 0,
        bulkPurchaseMode: false
      };
    
    case 'SET_BULK_PURCHASE_MODE':
      return { ...state, bulkPurchaseMode: action.payload };
    
    case 'UPDATE_HEX_OWNERSHIP': {
      const updatedTiles = state.hexTiles.map(tile => {
        if (action.payload.hexIds.includes(tile.h3Index)) {
          return {
            ...tile,
            ownershipStatus: 'owned' as HexOwnershipStatus,
            owner: action.payload.owner,
            lastUpdated: Date.now()
          };
        }
        return tile;
      });
      
      return { ...state, hexTiles: updatedTiles };
    }
    
    case 'SET_REGION':
      return { ...state, region: action.payload };
    
    case 'CALCULATE_TOTAL_COST': {
      const cost = Array.from(action.payload.selectedHexes).reduce((total, hexId) => {
        const hex = action.payload.hexTiles.find(h => h.h3Index === hexId);
        return total + (hex?.price || 0);
      }, 0);
      
      return { ...state, totalPurchaseCost: cost };
    }
    
    default:
      return state;
  }
}

// Типы для контекста
interface MapContextType {
  state: MapState;
  
  // Действия с данными
  loadHexTiles: (location: Location) => Promise<void>;
  
  // Действия с выбором
  toggleHexSelection: (hexId: string) => void;
  selectMultipleHexes: (hexIds: string[]) => void;
  clearSelection: () => void;
  
  // Действия с картой
  setZoom: (zoom: number) => void;
  setCenter: (center: { lat: number; lng: number }) => void;
  toggleHexGrid: () => void;
  
  // Действия с покупкой
  setBulkPurchaseMode: (enabled: boolean) => void;
  performBulkPurchase: (centerHexId: string) => void;
  purchaseSelectedHexes: (currency: Currency, setCurrency: (currency: Currency) => void, playerId: string) => Promise<boolean>;
}

// Создаем контекст
const MapContext = createContext<MapContextType | undefined>(undefined);

// Провайдер контекста
export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(mapReducer, initialState);

  // Загрузка hex-тайлов
  const loadHexTiles = useCallback(async (location: Location) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const tiles = await hexTileService.loadHexTilesForLocation(location);
      const regionInfo = await hexTileService.getRegionInfo(location);
      
      dispatch({ type: 'SET_HEX_TILES', payload: tiles });
      
      if (regionInfo) {
        dispatch({ type: 'SET_REGION', payload: regionInfo.region });
        dispatch({ type: 'SET_CENTER', payload: { 
          lat: regionInfo.center.latitude, 
          lng: regionInfo.center.longitude 
        }});
      }
    } catch (error) {
      console.error('Ошибка при загрузке hex-тайлов:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Переключение выбора hex-а
  const toggleHexSelection = useCallback((hexId: string) => {
    dispatch({ type: 'TOGGLE_HEX_SELECTION', payload: hexId });
  }, []);

  // Выбор нескольких hex-ов
  const selectMultipleHexes = useCallback((hexIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_HEXES', payload: new Set(hexIds) });
  }, []);

  // Очистка выбора
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  // Установка зума
  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  }, []);

  // Установка центра
  const setCenter = useCallback((center: { lat: number; lng: number }) => {
    dispatch({ type: 'SET_CENTER', payload: center });
  }, []);

  // Переключение hex-сетки
  const toggleHexGrid = useCallback(() => {
    dispatch({ type: 'SET_SHOW_HEX_GRID', payload: !state.showHexGrid });
  }, [state.showHexGrid]);

  // Установка режима массовой покупки
  const setBulkPurchaseMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_BULK_PURCHASE_MODE', payload: enabled });
    if (!enabled) {
      dispatch({ type: 'CLEAR_SELECTION' });
    }
  }, []);

  // Массовая покупка
  const performBulkPurchase = useCallback((centerHexId: string) => {
    try {
      const { availableHexes } = calculateBulkPurchaseCost(centerHexId, 3, state.hexTiles);
      
      if (availableHexes.length === 0) {
        console.warn('Нет доступных тайлов для массовой покупки');
        return;
      }
      
      dispatch({ type: 'SET_SELECTED_HEXES', payload: new Set(availableHexes) });
      dispatch({ type: 'SET_BULK_PURCHASE_MODE', payload: false });
    } catch (error) {
      console.error('Ошибка при массовой покупке:', error);
    }
  }, [state.hexTiles]);

  // Покупка выбранных hex-ов
  const purchaseSelectedHexes = useCallback(async (
    currency: Currency, 
    setCurrency: (currency: Currency) => void, 
    playerId: string
  ): Promise<boolean> => {
    if (state.selectedHexes.size === 0) {
      console.warn('Нет выбранных тайлов для покупки');
      return false;
    }

    if (currency.tokens < state.totalPurchaseCost) {
      console.warn('Недостаточно токенов для покупки');
      return false;
    }

    try {
      // Обновляем владение
      const hexIds = Array.from(state.selectedHexes);
      dispatch({ type: 'UPDATE_HEX_OWNERSHIP', payload: { hexIds, owner: playerId } });
      
      // Обновляем валюту
      setCurrency({
        ...currency,
        tokens: currency.tokens - state.totalPurchaseCost
      });
      
      // Сохраняем изменения
      if (state.region) {
        await hexTileService.saveHexTileChanges(state.hexTiles, state.region);
      }
      
      // Очищаем выбор
      dispatch({ type: 'CLEAR_SELECTION' });
      
      return true;
    } catch (error) {
      console.error('Ошибка при покупке тайлов:', error);
      return false;
    }
  }, [state.selectedHexes, state.totalPurchaseCost, state.hexTiles, state.region]);

  const contextValue: MapContextType = {
    state,
    loadHexTiles,
    toggleHexSelection,
    selectMultipleHexes,
    clearSelection,
    setZoom,
    setCenter,
    toggleHexGrid,
    setBulkPurchaseMode,
    performBulkPurchase,
    purchaseSelectedHexes
  };

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};

// Хук для использования контекста
export const useMapContext = (): MapContextType => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext должен использоваться внутри MapProvider');
  }
  return context;
};

export default MapContext;