/**
 * 工具函数集合
 */
const utils = {
  /**
   * 防抖函数
   * @param {Function} func - 需要防抖的函数
   * @param {number} wait - 等待时间，毫秒
   * @returns {Function} 防抖后的函数
   */
  debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  },

  /**
   * 节流函数
   * @param {Function} func - 需要节流的函数
   * @param {number} limit - 限制时间，毫秒
   * @returns {Function} 节流后的函数
   */
  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * 平滑滚动到指定元素
   * @param {string} selector - 元素选择器
   * @param {number} offset - 偏移量
   */
  scrollToElement(selector, offset = 80) {
    const element = document.querySelector(selector);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  },

  /**
   * 检查元素是否在视口中
   * @param {HTMLElement} element - 要检查的元素
   * @param {number} offset - 偏移量
   * @returns {boolean} 是否在视口中
   */
  isInViewport(element, offset = 100) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
      rect.bottom >= offset
    );
  }
};

// 暴露 utils 到全局
window.utils = utils;