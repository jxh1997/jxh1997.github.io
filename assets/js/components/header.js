/**
 * 导航栏组件逻辑
 */
document.addEventListener('DOMContentLoaded', function() {
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.querySelectorAll('a[href^="#"]');
  
  // 移动端菜单切换
  menuToggle.addEventListener('click', function() {
    mobileMenu.classList.toggle('hidden');
    const icon = menuToggle.querySelector('i');
    
    if (mobileMenu.classList.contains('hidden')) {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    } else {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-times');
    }
  });
  
  // 导航链接点击处理
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      
      // 只处理锚点链接
      if (targetId.startsWith('#')) {
        e.preventDefault();
        
        // 关闭移动菜单（如果打开）
        if (!mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          const icon = menuToggle.querySelector('i');
          icon.classList.remove('fa-times');
          icon.classList.add('fa-bars');
        }
        
        // 平滑滚动到目标位置
        utils.scrollToElement(targetId);
      }
    });
  });
  
  // 监听滚动，更新导航栏样式
  window.addEventListener('scroll', utils.throttle(function() {
    if (window.scrollY > 100) {
      navbar.classList.add('bg-white', 'shadow-md', 'py-2');
      navbar.classList.remove('py-4');
    } else {
      navbar.classList.remove('bg-white', 'shadow-md', 'py-2');
      navbar.classList.add('py-4');
    }
  }, 100));
});
