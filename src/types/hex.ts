// Типы для работы с гексагональной сеткой H3

export type HexOwnershipStatus = 'owned' | 'enemy' | 'free';

export interface HexTile {
  h3Index: string; // H3 индекс ячейки
  coordinates: { lat: number; lng: number }; // Координаты центра hex-а
  ownershipStatus: HexOwnershipStatus;
  price: number; // Цена в токенах
  owner?: string | null; // ID владельца
  lastUpdated: number; // Timestamp последнего обновления
  level?: number; // Уровень развития тайла (1-5)
  resources?: {
    oil?: number;
    gas?: number;
    gold?: number;
    silver?: number;
    stone?: number;
    wood?: number;
  };
}

export interface HexGridOptions {
  resolution: number; // H3 resolution (0-15)
  radius: number; // Радиус области в количестве hex-колец
  showOwnership: boolean; // Показывать ли цветовое кодирование владения
  showPrices: boolean; // Показывать ли цены на тайлах
  enableSelection: boolean; // Разрешить ли выбор тайлов
}

export interface BulkPurchaseData {
  centerHex: string; // H3 индекс центрального гекса
  radius: number; // Радиус покупки (обычно 3 для 37 тайлов)
  totalCost: number; // Общая стоимость
  hexIds: string[]; // Список H3 индексов для покупки
}

// H3 резолюции для разных зумов карты
export const H3_RESOLUTIONS = {
  COUNTRY: 6,    // 100 км - страны
  CITY: 7,       // 10 км - города  
  DISTRICT: 8,   // 1 км - районы
  STREET: 9,     // 100 м - улицы
  BUILDING: 10,  // 6 м - здания
} as const;

export type H3Resolution = typeof H3_RESOLUTIONS[keyof typeof H3_RESOLUTIONS];