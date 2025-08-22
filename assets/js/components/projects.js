/**
 * 项目展示组件逻辑
 */
document.addEventListener('DOMContentLoaded', function() {
  const projectFilters = document.querySelectorAll('.project-filter');
  const projectCards = document.querySelectorAll('.project-card');
  
  // 项目筛选功能
  projectFilters.forEach(filter => {
    filter.addEventListener('click', function() {
      // 更新筛选按钮状态
      projectFilters.forEach(f => {
        f.classList.remove('active', 'bg-primary', 'text-white');
        f.classList.add('bg-gray-100');
      });
      
      this.classList.add('active', 'bg-primary', 'text-white');
      this.classList.remove('bg-gray-100');
      
      const category = this.getAttribute('data-filter');
      
      // 筛选项目卡片
      projectCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
          card.style.display = 'block';
          
          // 添加淡入动画
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transition = 'opacity 0.3s ease';
          }, 50);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
});
