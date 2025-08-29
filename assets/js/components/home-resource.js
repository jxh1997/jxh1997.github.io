// 首页资源模块脚本：从 JSON 同步数据并渲染（SVG直接渲染版）
document.addEventListener('DOMContentLoaded', () => {
  const resourceContainer = document.getElementById('home-resource-container');
  // 分类主题色映射（与详情页、首页原有样式统一）
  const categoryColors = {
    toolbox: 'blue',    // 百宝箱-蓝色
    bookmark: 'purple', // 收藏夹-紫色
    site: 'green',      // 热门站点-绿色
    ai: 'orange'        // AI相关-橙色
  };

  // 加载 JSON 数据（与详情页共用同一文件，确保路径正确）
  async function loadHomeResourceData() {
    try {
      const response = await fetch('/data/resource-categories.json');
      if (!response.ok) throw new Error('资源数据加载失败');
      const data = await response.json();
      const categories = data.categories || [];

      // 渲染首页资源卡片（仅显示前3个高频工具/站点，避免卡片拥挤）
      renderHomeResourceCards(categories);
    } catch (error) {
      // 加载失败提示（与首页其他模块错误风格统一）
      resourceContainer.innerHTML = `
        <div class="col-span-full text-center py-16 bg-gray-50 rounded-xl">
          <i class="fa fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
          <p class="text-gray-600">资源数据加载失败</p>
          <button id="home-retry-resource" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            重试加载
          </button>
        </div>
      `;
      // 重试按钮事件
      document.getElementById('home-retry-resource').addEventListener('click', loadHomeResourceData);
      console.error('首页资源加载错误:', error);
    }
  }

  // 渲染首页资源卡片（适配首页样式，仅显示核心信息）
  function renderHomeResourceCards(categories) {
    resourceContainer.innerHTML = ''; // 清空加载状态

    categories.forEach(category => {
      const color = categoryColors[category.id] || 'blue'; // 匹配首页原有分类颜色
      // 取每个分类的前3个资源作为“快捷入口”（与首页原有设计一致）
      const quickResources = category.resources ? category.resources.slice(0, 3) : [];

      // 生成单个资源卡片 HTML
      const cardHtml = `
        <div class="resource-card group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-lg">
          <div class="w-16 h-16 bg-${color}-50 rounded-xl flex items-center justify-center mb-5 ml-5 mt-5 group-hover:bg-${color}-100 transition-colors">
            ${renderIcon(category.icon, color)}
          </div>
          <div class="p-5 md:p-6">
            <h3 class="text-lg font-semibold mb-3 text-gray-800">${category.name}</h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">
              ${category.description}
            </p>
            <div class="flex flex-wrap gap-2 mb-5">
              ${quickResources.map(resource => `
                <a href="${resource.url}" target="_blank" class="px-2 py-1 bg-${color}-50 text-${color}-600 text-xs rounded hover:bg-${color}-100 transition-colors">
                  ${resource.name}
                </a>
              `).join('')}
            </div>
            <a href="/resource.html#${category.id}" class="inline-flex items-center text-${color}-500 font-medium text-sm hover:text-${color}-600">
              ${getMoreText(category.id)} <i class="fa fa-arrow-right ml-1 text-xs"></i>
            </a>
          </div>
        </div>
      `;

      // 插入卡片到容器
      resourceContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
  }

  // 核心优化：渲染图标（SVG直接原样式渲染，FA图标适配颜色）
  function renderIcon(iconContent, color) {
    // 1. SVG图标：直接渲染原始内容（不修改尺寸、颜色、路径属性）
    if (iconContent.includes('<svg')) {
      return iconContent;
    }

    // 2. Font Awesome图标（处理完整<i>标签或简写）
    // 情况1：完整FA标签（如<i class="fa fa-wrench"></i>）
    if (iconContent.includes('<i class="fa')) {
      return iconContent.replace('class="', `class="text-${color}-500 `);
    }
    // 情况2：FA简写（如"fa-wrench"，兼容原始简写格式）
    else if (iconContent.startsWith('fa-')) {
      return `<i class="fa ${iconContent} text-2xl text-${color}-500"></i>`;
    }

    // 3. 图片格式图标（如外部SVG/PNG链接）
    if (iconContent.endsWith('.svg') || iconContent.endsWith('.png') || iconContent.endsWith('.jpg')) {
      return `<img src="${iconContent}" alt="分类图标" class="w-10 h-10 object-contain" />`;
    }

    // 4. 异常情况：默认图标 fallback
    return `<i class="fa fa-th-large text-2xl text-${color}-500"></i>`;
  }

  // 辅助函数：根据分类ID生成“查看更多”文本（与首页原有文案一致）
  function getMoreText(categoryId) {
    const textMap = {
      toolbox: '查看更多工具',
      bookmark: '查看全部收藏',
      site: '更多站点',
      ai: 'AI工具集'
    };
    return textMap[categoryId] || '查看更多';
  }

  // 初始化加载首页资源数据
  loadHomeResourceData();
});