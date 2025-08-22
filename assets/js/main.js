/**
 * 主入口脚本
 * 初始化所有组件和全局事件
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('个人主页加载完成');
  
  // 图片懒加载初始化
  const initLazyLoading = function() {
    const lazyImages = document.querySelectorAll('img');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const image = entry.target;
            image.classList.add('opacity-100');
            image.classList.remove('opacity-0');
            imageObserver.unobserve(image);
          }
        });
      });
      
      lazyImages.forEach(image => {
        image.classList.add('transition-opacity', 'duration-500', 'opacity-0');
        imageObserver.observe(image);
      });
    }
  };
  
  // 初始化所有功能
  initLazyLoading();
  
  // 页面加载动画
  document.body.classList.add('loaded');
});
