// /assets/js/components/projects.js
document.addEventListener('DOMContentLoaded', async () => {
  const projectGrid = document.querySelector('#projects .grid');
  if (!projectGrid) return;

  // 1. 加载本地 JSON 文件（浏览器环境需通过 fetch 读取）
  projectGrid.innerHTML = `
    <div class="col-span-full text-center py-10">
      <i class="fa fa-spinner fa-spin text-primary text-2xl mb-3"></i>
      <p class="text-gray-600">正在加载项目数据...</p>
    </div>
  `;

  try {
    // 2. 读取本地 JSON（注意：需启动本地服务，否则浏览器会拦截 file:// 请求）
    const response = await fetch('/data/projects.json'); 
    if (!response.ok) throw new Error('项目数据加载失败');
    const projects = await response.json();

    // 3. 按 updateTime 排序（倒序，取最新），截取前 3 篇
    const sortedProjects = projects
      .sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
      .slice(0, 3); // 仅展示最新 3 篇

    // 4. 渲染最新 3 篇项目
    projectGrid.innerHTML = '';
    sortedProjects.forEach(project => {
      const projectCard = document.createElement('div');
      projectCard.className = 'project-card card-hover rounded-xl overflow-hidden shadow-sm bg-light border border-gray-100';
      projectCard.setAttribute('data-category', project.category);

      // 拼接卡片 HTML（复用原结构，替换动态数据）
      projectCard.innerHTML = `
        <div class="relative">
          <img src="${project.coverImage}" alt="${project.title}" class="w-full h-48 object-cover" loading="lazy">
          <span class="absolute top-3 left-3 text-white text-xs font-medium px-3 py-1 rounded-full" 
                style="background-color: ${project.category === 'career' ? '#165DFF' : '#FF7D00'}">
            ${project.category === 'career' ? '主业项目' : '副业项目'}
          </span>
        </div>
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-2">${project.title}</h3>
          <p class="text-gray-600 text-sm mb-4">${project.description}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            ${project.tags.map(tag => `<span class="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">${tag}</span>`).join('')}
          </div>
          <a href="${project.detailUrl}" class="inline-flex items-center text-primary font-medium text-sm hover:underline">
            查看详情 <i class="fa fa-arrow-right ml-1"></i>
          </a>
        </div>
      `;

      projectGrid.appendChild(projectCard);
    });

  } catch (error) {
    projectGrid.innerHTML = `
      <div class="col-span-full text-center py-10">
        <i class="fa fa-exclamation-circle text-red-500 text-2xl mb-3"></i>
        <p class="text-gray-600">项目数据加载失败：${error.message}</p>
      </div>
    `;
    console.error('项目加载错误：', error);
  }

  // 5. 保留筛选功能（仅对已渲染的 3 篇生效）
  const filterButtons = document.querySelectorAll('.project-filter');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active', 'bg-primary', 'text-white'));
      button.classList.add('active', 'bg-primary', 'text-white');

      const filter = button.getAttribute('data-filter');
      projectGrid.querySelectorAll('.project-card').forEach(card => {
        card.style.display = 
          filter === 'all' || card.getAttribute('data-category') === filter 
          ? 'block' 
          : 'none';
      });
    });
  });
});