/**
 * Этот скрипт удаляет любые баннеры MiniMax из DOM
 */

export const removeBanners = () => {
  // Функция для удаления элементов по селектору
  const removeElements = (selector: string) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  };

  // Функция для удаления элементов по стилю
  const removeByStyle = (
    styleProps: { property: string; valuePattern: string }[]
  ) => {
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const matchesAllProps = styleProps.every(({ property, valuePattern }) => {
        const propValue = computedStyle.getPropertyValue(property);
        return new RegExp(valuePattern).test(propValue);
      });
      
      if (matchesAllProps) {
        el.remove();
      }
    });
  };

  // Удаление по классам и ID
  removeElements('.minimax-banner');
  removeElements('[class*="minimax"]');
  removeElements('[id*="minimax"]');
  removeElements('[data-minimax]');
  
  // Удаление по атрибутам
  removeElements('a[href*="minimax"]');
  removeElements('iframe[src*="minimax"]');
  
  // Удаление фиксированных элементов в правом нижнем углу
  removeByStyle([
    { property: 'position', valuePattern: 'fixed' },
    { property: 'bottom', valuePattern: '\\d+px' },
    { property: 'right', valuePattern: '\\d+px' },
    { property: 'z-index', valuePattern: '\\d{3,}' }
  ]);
  
  // Запускаем проверку повторно через интервал (баннеры могут добавляться динамически)
  const intervalId = setInterval(() => {
    removeElements('.minimax-banner');
    removeElements('[class*="minimax"]');
    removeElements('[id*="minimax"]');
    removeElements('[data-minimax]');
    removeElements('a[href*="minimax"]');
    removeElements('iframe[src*="minimax"]');
  }, 1000);
  
  // Очистка интервала при размонтировании компонента
  return () => clearInterval(intervalId);
};

export default removeBanners;