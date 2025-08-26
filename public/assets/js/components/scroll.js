/**
 * 滚动相关功能
 */
document.addEventListener('DOMContentLoaded', function() {
  const backToTopButton = document.getElementById('back-to-top');
  const sections = document.querySelectorAll('section[id]');
  
  // 返回顶部按钮点击事件
  backToTopButton.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // 监听滚动，更新返回顶部按钮显示状态
  window.addEventListener('scroll', utils.throttle(function() {
    if (window.scrollY > 500) {
      backToTopButton.classList.remove('opacity-0', 'invisible');
      backToTopButton.classList.add('opacity-100', 'visible');
    } else {
      backToTopButton.classList.add('opacity-0', 'invisible');
      backToTopButton.classList.remove('opacity-100', 'visible');
    }
    
    // 更新当前激活的导航链接
    updateActiveNavLink();
  }, 100));
  
  // 更新当前激活的导航链接
  function updateActiveNavLink() {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      
      if (pageYOffset >= sectionTop - 100) {
        current = section.getAttribute('id');
      }
    });
    
    document.querySelectorAll('nav a').forEach(link => {
      link.classList.remove('text-primary');
      link.classList.add('text-dark');
      
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.remove('text-dark');
        link.classList.add('text-primary');
      }
    });
  }
});
