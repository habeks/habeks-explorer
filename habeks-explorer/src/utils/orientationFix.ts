/**
 * Утилита для исправления высоты на мобильных устройствах
 */
export const applyOrientationFix = () => {
  // Устанавливаем правильную высоту для мобильных устройств
  const setVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Вызываем функцию сразу
  setVh();

  // И при изменении размера или ориентации
  window.addEventListener('resize', setVh);
  window.addEventListener('orientationchange', setVh);

  // Принудительная вертикальная ориентация для мобильных
  const checkOrientation = () => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      try {
        // Только для мобильных устройств
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          // Проверяем наличие screen.orientation и метода lock
          const orientation = window.screen && (window.screen as any).orientation;
          if (orientation && typeof orientation['lock'] === 'function') {
            orientation['lock']('portrait').catch(() => {
              // Некоторые браузеры не поддерживают блокировку ориентации
              console.log('Ориентация не может быть заблокирована');
            });
          } else {
            console.log('Браузер не поддерживает блокировку ориентации');
          }
        }
      } catch (e) {
        console.error('Ошибка при попытке заблокировать ориентацию:', e);
      }
    }
  };

  // Проверяем ориентацию при загрузке
  checkOrientation();

  // Очистка при размонтировании
  return () => {
    window.removeEventListener('resize', setVh);
    window.removeEventListener('orientationchange', setVh);
  };
};

export default applyOrientationFix;