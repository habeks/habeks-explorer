# Habeks Explorer

🚀 **Cyberpunk AR-исследователь с гексагональными тайлами и картой владений**

## Описание

Habeks Explorer - это прогрессивное веб-приложение (PWA) в стиле cyberpunk, которое объединяет:

- 🗺️ **Интерактивную карту владений** с гексагональными тайлами H3
- 📱 **AR-сбор предметов** через мобильную камеру  
- 🎮 **Игровую механику** с токенами, шардами и ресурсами
- 🌐 **Полную мобильную адаптацию** и PWA функциональность

## Возможности

### 🗺️ Карта владений
- Полноэкранная интерактивная карта на базе MapLibre GL
- Гексагональная сетка H3 с разными уровнями масштабирования
- Покупка и управление земельными участками
- Массовая покупка территорий (37 гексов)
- Визуализация владений: свои/чужие/свободные

### 📱 AR-сбор предметов
- Камера с поддержкой HTTPS и мобильных браузеров
- Обнаружение движения устройства
- Сбор артефактов разной редкости
- Прогрессивная система времени сбора
- Touch-оптимизированный интерфейс

### 🎨 Cyberpunk дизайн
- Неоновые акценты и анимации
- Стеклянные панели с blur-эффектами
- Адаптивная типографика Orbitron/Exo 2
- Плавные переходы и hover-эффекты

### 📱 PWA оптимизация
- Установка как нативное приложение
- Offline поддержка основных функций
- Service Worker для кэширования
- Splash screen и иконки приложения
- Мобильные мета-теги и viewport

## Технологический стек

- **Frontend**: React 18 + TypeScript + Vite
- **Стили**: TailwindCSS + Custom Cyberpunk CSS
- **Карты**: MapLibre GL JS + OpenStreetMap
- **Гексы**: H3-js для гексагональных тайлов
- **PWA**: Vite-Plugin-PWA + Workbox
- **Деплой**: GitHub Pages + GitHub Actions

## Быстрый старт

### Разработка

```bash
# Клонирование репозитория
git clone https://github.com/habeks/habeks-explorer.git
cd habeks-explorer

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

### Сборка для продакшена

```bash
# Сборка для GitHub Pages
npm run build:gh-pages

# Локальный preview
npm run preview
```

## Деплой

Проект автоматически разворачивается на GitHub Pages при push в ветку `main`.

🌐 **Live Demo**: [https://habeks.github.io/habeks-explorer](https://habeks.github.io/habeks-explorer)

## Архитектура

### Компоненты

```
src/
├── components/
│   ├── Layout/           # AppLayout, Header, TabNavigation
│   ├── Pages/            # OwnershipMap, ARCollection, Exploration
│   ├── map/              # MapView, HexGrid, MapControls  
│   ├── Auth/             # AuthModal
│   └── UI/               # LoadingScreen, NotificationToast
├── styles/               # cyberpunk.css, map.css
├── hooks/                # useHexTiles, useGeolocation
├── services/             # DataService, geolocation
├── utils/                # hexUtils, h3Utils
└── types/                # TypeScript типы
```

### Особенности реализации

1. **Полноэкранная карта**: использует `absolute inset-0` для 100% viewport
2. **Z-index слои**: навигация `z-[100]`, панели `z-40`, карта `z-10`
3. **Touch-оптимизация**: минимум 56px для кнопок, `touch-action: manipulation`
4. **AR камера**: HTTPS проверки, fallback конфигурации, улучшенная обработка ошибок
5. **PWA кэширование**: OSM тайлы, шрифты Google, статические ресурсы

## Браузерная поддержка

- ✅ Chrome/Chromium 90+
- ✅ Safari 14+ (iOS/macOS)
- ✅ Firefox 88+
- ✅ Edge 90+
- ⚠️ AR функции требуют HTTPS

## Исправленные баги

1. ✅ **Карта на весь экран**: `absolute inset-0` вместо `h-full`
2. ✅ **Большие AR-кнопки**: `min-height: 56px`, grid-layout
3. ✅ **Меню поверх карты**: `z-[100]` для навигации
4. ✅ **Работающая кнопка тайлов**: улучшенная обратная связь, уведомления
5. ✅ **Стабильная AR камера**: HTTPS проверки, множественные fallback

## Разработка

### Добавление новых функций

1. Создайте компонент в соответствующей папке
2. Добавьте типы в `/types`
3. Обновите маршрутизацию в `AppLayout.tsx`
4. Добавьте стили в `cyberpunk.css`

### Тестирование PWA

1. Соберите проект: `npm run build:gh-pages`
2. Запустите preview: `npm run preview`
3. Откройте DevTools → Application → Service Workers
4. Проверьте установку PWA через меню браузера

## Лицензия

MIT License - свободное использование с указанием авторства.

---

**Создано командой Habeks** 🚀

*Исследуйте будущее с технологиями сегодня!*