// Основные типы для игры

// Экспорт типов из подмодулей
export * from './hex';

export interface Player {
  id: string;
  nickname: string;
  email: string;
  level: number;
  experience: number;
  avatar?: string;
  createdAt: Date;
}

export interface Currency {
  tokens: number;
  shards: number;
  orbs: number;
  oil: number;
  gas: number;
  gold: number;
  silver: number;
  stone: number;
  wood: number;
}

// HexTile теперь импортируется из hex.ts
// Legacy интерфейс для обратной совместимости
export interface LegacyHexTile {
  id: string;
  coordinates: [number, number]; // lat, lng
  layer: 1 | 2 | 3 | 4 | 5; // Слои: 6м, 100м, 1км, 10км, 100км
  owner?: string;
  price: number;
  status: 'free' | 'owned' | 'enemy';
  color: string;
  resources?: GameItem[];
}

export interface GameItem {
  id: string;
  type: 'weapon' | 'armor' | 'artifact' | 'resource' | 'consumable';
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  description: string;
  icon: string;
  value: number;
  properties?: Record<string, any>;
  coordinates?: [number, number];
  captureProgress?: number;
  captureTime?: number; // 3-9 секунд
}

export interface ARObject {
  id: string;
  position: [number, number, number]; // x, y, z в AR пространстве
  type: 'item' | 'enemy' | 'portal' | 'resource';
  item?: GameItem;
  isVisible: boolean;
  distance: number;
  captureRadius: number;
}

export interface GameSettings {
  scanRadius: number; // метры
  arSensitivity: number;
  notifications: boolean;
  soundEnabled: boolean;
  qualityLevel: 'low' | 'medium' | 'high';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  reward: Currency;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface AppTab {
  id: 'ownership' | 'exploration' | 'ar-collection';
  title: string;
  icon: string;
  component: React.ComponentType;
}

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'item_found' | 'tile_captured' | 'achievement' | 'energy_recharged';
  timestamp: Date;
  read: boolean;
}

// H3 интерфейсы
export interface H3Index {
  index: string;
  resolution: number;
  centerCoordinates: [number, number];
}

// Состояние приложения
export interface AppState {
  isAuthenticated: boolean;
  player: Player | null;
  currency: Currency;
  location: Location | null;
  settings: GameSettings;
  inventory: GameItem[];
  achievements: Achievement[];
  notifications: NotificationData[];
  currentTab: AppTab['id'];
  isLoading: boolean;
  error: string | null;
}

// API интерфейсы
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  googleToken?: string;
}

export interface RegisterRequest {
  email: string;
  nickname: string;
  termsAccepted: boolean;
  googleToken?: string;
}

// Camera и AR типы
export interface CameraConstraints {
  video: {
    width: { ideal: number };
    height: { ideal: number };
    facingMode: 'environment' | 'user';
  };
  audio: false;
}

export interface ARCapture {
  itemId: string;
  startTime: number;
  progress: number;
  isCapturing: boolean;
  requiredTime: number;
}

// Карта и геолокация
export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export interface MapStyle {
  version: number;
  name: string;
  sources: Record<string, any>;
  layers: any[];
  glyphs?: string;
  sprite?: string;
}

// PWA типы
export interface PWAUpdateAvailable {
  waiting: boolean;
  updateSW: () => Promise<void>;
}

export interface InstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Игровая математика
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Transform {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
}

// События
export interface GameEvent {
  type: 'tile_purchased' | 'item_collected' | 'level_up' | 'achievement_unlocked';
  timestamp: Date;
  data: any;
  playerId: string;
}

// WebGL и рендеринг
export interface RenderStats {
  fps: number;
  frameTime: number;
  triangles: number;
  drawCalls: number;
  memoryUsage: number;
}

// Статистика игрока
export interface PlayerStats {
  totalTilesPurchased: number;
  totalItemsCollected: number;
  totalDistanceWalked: number;
  totalPlayTime: number;
  favoriteTileType: string;
  lastLoginDate: Date;
  consecutiveDays: number;
}