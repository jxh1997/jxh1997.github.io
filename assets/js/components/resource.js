// 资源汇总页核心脚本（修复版：渲染错误+跳转定位）
document.addEventListener('DOMContentLoaded', () => {
  // 基础元素获取（增加存在性判断，避免报错）
  const resourceContainer = document.getElementById('dynamic-resource-container');
  const categorySidebar = document.getElementById('category-sidebar');
  const categoryList = categorySidebar ? categorySidebar.querySelector('ul') : null;
  const searchInput = document.getElementById('resource-search');
  const searchCount = document.getElementById('search-count');
  const mobileCategoryBtn = document.getElementById('mobile-category-btn');

  let allResourceData = [];
  let activeCategoryId = '';
  let isSearching = false;

  // 初始化：优先解析URL锚点（解决首页跳转定位问题）
  function initActiveCategory() {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && allResourceData.some(cat => cat.id === hash)) {
      return hash; // 锚点存在且有效，优先使用
    }
    return allResourceData[0].id || 'toolbox';
  }

  // 加载JSON数据
  async function loadResourceData() {
    try {
      if (!resourceContainer) throw new Error('资源容器不存在');
      // 加载状态（避免空白）
      resourceContainer.innerHTML = `
        <div class="flex justify-center py-16">
          <div class="loader"></div>
        </div>
      `;

      const response = await fetch('/data/resource-categories.json');
      if (!response.ok) throw new Error(`HTTP错误：${response.status}`);
      const data = await response.json();
      if (!data.categories) throw new Error('JSON格式错误，无categories字段');

      // 处理SVG图标 + 校准统计数据
      const processedData = processSvgIcons(data.categories);
      allResourceData = calibrateCategoryStats(processedData);
      activeCategoryId = initActiveCategory();

      // 渲染组件（确保顺序：先导航后内容）
      if (categoryList) renderCategorySidebar();
      renderResourceStats(); // 渲染资源统计
      renderCurrentCategory(activeCategoryId);

    } catch (error) {
      // 错误提示（兼容容器不存在的情况）
      if (resourceContainer) {
        resourceContainer.innerHTML = `
          <div class="py-16 text-center">
              <i class="fa fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
              <p class="text-gray-600">资源数据加载失败</p>
              <p class="text-gray-500 text-sm mb-4">${error.message}</p>
              <button id="retry-load" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  重试加载
              </button>
          </div>
        `;
        // 修复：重试按钮事件绑定（增加存在性判断）
        const retryBtn = document.getElementById('retry-load');
        retryBtn && retryBtn.addEventListener('click', loadResourceData);
      }
      console.error('资源加载错误:', error);
    }
  }

  // 保留原样式的SVG图标处理（仅补全闭合标签+添加统一类，不删除任何属性）
  function processSvgIcons(categories) {
    return categories.map(category => {
      const processedCategory = {...category};

      // 仅处理内嵌SVG（外部SVG文件建议通过img标签加载）
      if (processedCategory.icon && processedCategory.icon.includes('<svg')) {
        // 1. 仅补全SVG闭合标签（避免破坏HTML结构，不删除任何原属性）
        if (!processedCategory.icon.includes('</svg>')) {
          processedCategory.icon += '</svg>';
        }

        // 2. 仅添加统一容器类（svg-icon）和分类颜色父类（不覆盖原样式）
        // 注意：不删除width/height/fill/stroke等任何原有属性
        processedCategory.icon = processedCategory.icon.replace('<svg', `<svg class="svg-icon ${processedCategory.color}-icon"`);
      }

      // 4. 资源图标处理（同样保留原样式）
      if (processedCategory.resources) {
        processedCategory.resources = processedCategory.resources.map(resource => {
          if (resource.icon && resource.icon.includes('<svg')) {
            // 仅补全闭合标签+添加统一类，不修改原样式
            let processedIcon = resource.icon;
            if (!processedIcon.includes('</svg>')) processedIcon += '</svg>';
            resource.icon = processedIcon.replace('<svg', `<svg class="svg-icon"`);
          }
          return resource;
        });
      }

      return processedCategory;
    });
  }

  // 校准统计数据
  function calibrateCategoryStats(categories) {
    return categories.map(category => {
      const realTotal = category.resources.length || 0;
      const tagStats = category.tags.map(tag => ({
        ...tag,
        count: tag.id === 'all' ? realTotal : category.resources.filter(res => res.tags.includes(tag.id)).length || 0
      }));
      return {
        ...category,
        total: realTotal,
        tags: tagStats
      };
    });
  }

  // 渲染左侧分类导航
  function renderCategorySidebar() {
    if (!categoryList) return;
    categoryList.innerHTML = '';

    allResourceData.forEach(category => {
      const isActive = category.id === activeCategoryId;

      // 区分SVG图标和Font Awesome图标
      let iconHtml = '';
      if (category.icon.includes('<svg')) {
        iconHtml = `<div class="${category.color}-text">${category.icon}</div>`;
      } else {
        iconHtml = `<i class="fa ${category.icon} text-${category.color}-500"></i>`;
      }

      const categoryItem = document.createElement('li');
      categoryItem.innerHTML = `
        <a href="#${category.id}" class="category-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors ${isActive ? 'active bg-primary/5 text-primary' : ''}" data-category="${category.id}">
          <div class="w-5 text-center">${iconHtml}</div>
          <span class="flex-1">${category.name}</span>
          <span class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">${category.total}</span>
        </a>
      `;
      categoryList.appendChild(categoryItem);
    });

    bindCategoryClick();
  }

  // 渲染当前分类（闭合逻辑+补全变量定义）
  function renderCurrentCategory(categoryId) {
    if (!resourceContainer) return;
    const currentCategory = allResourceData.find(c => c.id === categoryId);
    if (!currentCategory) {
      resourceContainer.innerHTML = `
        <div class="py-16 text-center">
          <i class="fa fa-folder-open-o text-5xl text-gray-200 mb-4"></i>
          <p class="text-gray-500">当前分类不存在</p>
        </div>
      `;
      return;
    }

    // 分类标题图标渲染（修复SVG尺寸）
    let categoryIcon = '';
    if (currentCategory.icon.includes('<svg')) {
      categoryIcon = currentCategory.icon.replace('class="svg-icon"', 'class="svg-icon" style="width:28px;height:28px;"');
    } else {
      categoryIcon = `<i class="fa ${currentCategory.icon} text-2xl text-${currentCategory.color}-500"></i>`;
    }

    // 修复：资源卡片渲染（补全safeName/safeDesc/tagHtml定义）
    const resourceCards = currentCategory.resources.map(resource => {
      // 资源图标处理
      let resourceIcon = '';
      if (resource.icon && resource.icon.includes('<svg')) {
        resourceIcon = resource.icon.replace('class="svg-icon"', 'class="svg-icon" style="width:20px;height:20px;"');
      } else {
        resourceIcon = `<i class="fa ${resource.icon || 'fa-link'} text-lg"></i>`;
      }

      // 补全：HTML转义+搜索高亮
      const safeName = escapeHtml(resource.name);
      const safeDesc = escapeHtml(resource.description || '暂无描述');
      // 标签渲染
      const tagHtml = resource.tags.map(tag => {
        const safeTag = escapeHtml(tag);
        if (tag === '免费') {
          return `<span class="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">${safeTag}</span>`;
        } else if (tag === '付费') {
          return `<span class="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full">${safeTag}</span>`;
        } else {
          return `<span class="px-2 py-0.5 bg-${currentCategory.color}/10 text-${currentCategory.color} text-xs rounded-full">${safeTag}</span>`;
        }
      }).join('');

      // 资源卡片HTML（闭合逻辑）
      return `
        <div class="resource-card bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1" data-resource-id="${resource.id || resource.name}">
          <div class="p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-${currentCategory.color}/10 flex items-center justify-center ${currentCategory.color}-text">
                  ${resourceIcon}
              </div>
              <h3 class="font-semibold text-base text-gray-800">${safeName}</h3>
            </div>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
              ${safeDesc}
            </p>
            <div class="flex flex-wrap gap-1.5 mb-4">
              ${tagHtml}
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-gray-50">
              <a href="${escapeHtml(resource.url)}" target="_blank" class="text-primary text-sm font-medium hover:text-primary/80 hover:underline flex items-center gap-1">
                <span>立即访问</span>
                <i class="fa fa-external-link text-xs"></i>
              </a>
              <button class="copy-link text-gray-400 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-gray-50" data-url="${escapeHtml(resource.url)}" data-tip="${escapeHtml(resource.copyTip || '链接已复制')}">
                <i class="fa fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      }).join('');

      // 拼接完整分类HTML（修复闭合逻辑）
      resourceContainer.innerHTML = `
      <div class="resource-section">
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold mb-2 flex items-center gap-2">
            <div class="${currentCategory.color}-text">${categoryIcon}</div>
            <span>${escapeHtml(currentCategory.name)}</span>
          </h2>
          <p class="text-gray-600 text-sm">${escapeHtml(currentCategory.description || '提供丰富的相关资源，满足您的使用需求')}</p>
        </div>
        <span class="text-gray-500 text-sm mt-2 md:mt-0 flex items-center gap-1">
          <i class="fa fa-database"></i> 共 ${currentCategory.total} 个全量资源
        </span>
      </div>

      <div class="flex flex-wrap gap-2 mb-6">
      ${currentCategory.tags.map(tag => {
        const isActive = tag.id === 'all';
        return `
          <button class="tag-filter flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
              isActive ? 'active bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
          }" data-category="${categoryId}" data-tag="${tag.id}" ${tag.count === 0 && tag.id !== 'all' ? 'disabled' : ''}>
              ${escapeHtml(tag.name)}
              <span class="text-xs opacity-80">(${tag.count})</span>
          </button>
          `;
          }).join('')}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${resourceCards}
        </div>

        ${currentCategory.total === 0 ? `
          <div class="text-center py-16 bg-gray-50 rounded-xl border border-gray-100">
            <i class="fa fa-folder-open-o text-5xl text-gray-200 mb-4"></i>
            <p class="text-gray-500 mb-2">当前分类暂无资源</p>
            <p class="text-gray-400 text-sm">我们将持续更新，敬请期待</p>
          </div>
        ` : ''}
      </div>
    `;

    // 绑定事件（确保DOM已生成）
    setTimeout(() => {
      bindTagFilterClick();
      bindCopyLinkClick();
    }, 100);
  }

    // 8. 绑定分类点击（修复：可选链语法）
    function bindCategoryClick() {
      const categoryItems = document.querySelectorAll('.category-item');
      categoryItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const targetCategoryId = item.getAttribute('data-category');
          if (targetCategoryId === activeCategoryId && !isSearching) return;

          // 更新状态并渲染
          activeCategoryId = targetCategoryId;
          if (categoryList) renderCategorySidebar();
          renderCurrentCategory(targetCategoryId);

          // 延迟滚动（确保目标区块已生成）
          setTimeout(() => scrollToSection(targetCategoryId), 200);

          // 移动端关闭导航（修复可选链语法）
          if (mobileCategoryBtn && categorySidebar) {
            categorySidebar.classList.add('hidden');
            const icon = mobileCategoryBtn.querySelector('i');
            icon.classList.replace('fa-times', 'fa-bars');
          }

          // 重置搜索
          if (isSearching && searchInput && searchCount) {
            searchInput.value = '';
            searchCount.classList.add('hidden');
            isSearching = false;
          }
        });
      });
    }

    // 9. 绑定标签筛选
    function bindTagFilterClick() {
      const tagFilters = document.querySelectorAll('.tag-filter');
      tagFilters.forEach(tag => {
        // 禁用无资源的标签
        const tagCount = tag.querySelector('span').textContent.replace(/[()]/g, '') || '0';
        if (tagCount === '0' && tag.getAttribute('data-tag') !== 'all') {
          tag.disabled = true;
          tag.classList.add('opacity-50', 'cursor-not-allowed');
          return;
        }

        tag.addEventListener('click', () => {
          const categoryId = tag.getAttribute('data-category');
          const tagId = tag.getAttribute('data-tag');
          const currentCategory = allResourceData.find(c => c.id === categoryId);
          if (!currentCategory) return;

          // 激活态切换
          const sameCategoryTags = document.querySelectorAll(`.tag-filter[data-category="${categoryId}"]`);
          sameCategoryTags.forEach(t => t.classList.remove('active', 'bg-primary', 'text-white', 'shadow-sm'));
          tag.classList.add('active', 'bg-primary', 'text-white', 'shadow-sm');

          // 筛选资源
          const resourceCards = document.querySelectorAll(`#${categoryId} .resource-card`);
          resourceCards.forEach(card => {
            const resourceId = card.getAttribute('data-resource-id');
            const resource = currentCategory.resources.find(r => (r.id || r.name) === resourceId);
            if (!resource) return;

            if (tagId === 'all' || resource.tags.includes(tagId)) {
              card.classList.remove('hidden');
              card.style.opacity = '0';
              setTimeout(() => card.style.opacity = '1', 100);
            } else {
              card.classList.add('hidden');
            }
          });
        });
      });
    }

    // 10. 复制链接
    function bindCopyLinkClick() {
      const copyButtons = document.querySelectorAll('.copy-link');
      copyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
          const url = btn.getAttribute('data-url');
          const tip = btn.getAttribute('data-tip');
          if (!url) return;

          try {
            await navigator.clipboard.writeText(url);
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fa fa-check text-green-500"></i>';

            // 提示框（增加DOM存在性判断）
            if (document.body) {
              const tipEl = document.createElement('span');
              tipEl.className = 'absolute z-50 bg-black/80 text-white px-3 py-1 rounded-md text-xs whitespace-nowrap';
              tipEl.textContent = tip;
              document.body.appendChild(tipEl);

              // 定位提示框
              const btnRect = btn.getBoundingClientRect();
              if (btnRect) {
                tipEl.style.top = `${btnRect.top - 30}px`;
                tipEl.style.left = `${btnRect.left + btnRect.width/2 - tipEl.offsetWidth/2}px`;
              }

              // 移除提示框
              setTimeout(() => {
                btn.innerHTML = originalIcon;
                document.body.removeChild(tipEl);
              }, 1500);
            }
          } catch (err) {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制链接');
          }
        });
      });
    }

    // 11. 修复：搜索功能（语法+逻辑闭合）
    if (searchInput) {
      searchInput.addEventListener('input', () => {
          const searchValue = searchInput.value.trim().toLowerCase();
          if (!searchValue) {
            isSearching = false;
            searchCount.classList.add('hidden');
            renderCurrentCategory(activeCategoryId);
            return;
          }

          isSearching = true;
          let matchCount = 0;
          if (!resourceContainer) return;
          resourceContainer.innerHTML = '';

          allResourceData.forEach(category => {
            // 筛选匹配的资源
            const matchedResources = category.resources.filter(resource => {
              const matchName = resource.name.toLowerCase().includes(searchValue);
              const matchDesc = (resource.description || '').toLowerCase().includes(searchValue);
              const matchTag = resource.tags.some(tag => tag.toLowerCase().includes(searchValue));
              return matchName || matchDesc || matchTag;
            });

            if (matchedResources.length === 0) return;
            matchCount += matchedResources.length;

            // 分类图标处理
            const categoryIcon = category.icon.includes('<svg') ?
              category.icon.replace('width="24"', 'width="20"').replace('height="24"', 'height="20"') :
              `<i class="fa ${category.icon}"></i>`;

            // 生成匹配资源HTML（修复模板语法+闭合）
            const matchedHtml = `
            <div class="resource-section mb-10">
              <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <div class="${category.color}-text">${categoryIcon}</div>
                <span>${escapeHtml(category.name)}（匹配 ${matchedResources.length} 个）</span>
              </h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${matchedResources.map(resource => {
                // 资源图标处理
                const resourceIcon = resource.icon?.includes('<svg') 
                  ? resource.icon.replace('width="24"', 'width="20"').replace('height="24"', 'height="20"') 
                  : `<i class="fa ${resource.icon || 'fa-link'}"></i>`;

                // 搜索高亮+HTML转义
                const safeName = highlightMatch(escapeHtml(resource.name), searchValue);
                const safeDesc = highlightMatch(escapeHtml(resource.description || '暂无描述'), searchValue);

                // 标签渲染
                const tagHtml = resource.tags.map(tag => {
                const safeTag = highlightMatch(escapeHtml(tag), searchValue);
                if (tag === '免费') {
                  return `<span class="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">${safeTag}</span>`;
                } else if (tag === '付费') {
                  return ` <span class="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full">${safeTag}</span>`;
            } else {
              return `<span class="px-2 py-0.5 bg-${category.color}/10 text-${category.color} text-xs rounded-full">${safeTag}</span>`;
            }
          }).join('');

        // 资源卡片HTML
        return `
        <div class="resource-card bg-white rounded-xl border border-gray-100 overflow-hidden 
          shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
          <div class="p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-${category.color}/10 flex items-center justify-center ${category.color}-text">
                ${resourceIcon}
              </div>
              <h3 class="font-semibold text-base text-gray-800">${safeName}</h3>
            </div>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
              ${safeDesc}
            </p>
            <div class="flex flex-wrap gap-1.5 mb-4">
              ${tagHtml}
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-gray-50">
              <a href="${escapeHtml(resource.url)}" target="_blank" 
                class="text-primary text-sm font-medium hover:text-primary/80 hover:underline flex items-center gap-1">
                <span>立即访问</span>
                <i class="fa fa-external-link text-xs"></i>
              </a>
              <button class="copy-link text-gray-400 hover:text-primary transition-colors p-1.5 rounded-full hover:bg-gray-50"
                data-url="${escapeHtml(resource.url)}" data-tip="${escapeHtml(resource.copyTip || '链接已复制')}">
                <i class="fa fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('')
  } </div> </div >`;
    resourceContainer.insertAdjacentHTML('beforeend', matchedHtml);
  });

  // 更新搜索统计（修复模板语法）
  if (searchCount) {
    searchCount.textContent = `
    找到 $ {
      matchCount
    }
    个相关资源 `;
      searchCount.classList.remove('hidden');
      searchCount.className = 'fixed top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm shadow-md z-40';
    }

    // 无匹配结果
    if (matchCount === 0 && resourceContainer) {
      resourceContainer.innerHTML = `
        <div class = "text-center py-16 bg-gray-50 rounded-xl border border-gray-100" >
          <i class = "fa fa-search text-5xl text-gray-200 mb-4" > </i> 
          <p class = "text-gray-500 mb-2" > 未找到与“ ${escapeHtml(searchValue)}” 相关的资源 </p> 
          <p class = "text-gray-400 text-sm" > 建议尝试其他关键词或查看全部分类 </p> 
        </div >
      `;}

      // 绑定复制事件
      setTimeout(() => bindCopyLinkClick(), 100);
    });
  }

  // 12. 辅助函数：滚动到分类
  function scrollToSection(categoryId) {
    const section = document.getElementById(categoryId);
    const header = document.querySelector('header');
    if (!section || !header) return;

    const headerHeight = header.offsetHeight;
    const sectionTop = section.offsetTop - headerHeight - 20; // 额外偏移
    window.scrollTo({
      top: sectionTop,
      behavior: 'smooth'
    });

    // 更新URL锚点
    window.history.replaceState(null, null, `#${categoryId}`);
  }

  // 13. 辅助函数：HTML转义（避免XSS）
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 搜索高亮（修复正则语法）
  function highlightMatch(text, searchValue) {
    if (!searchValue) return text;
    const regex = new RegExp(`(${searchValue})`, 'gi');
    return text.replace(regex, '<span class="bg-yellow-100 text-yellow-800 px-0.5 rounded-md">$1</span>');
  }

  // 计算资源统计数据
  function calculateResourceStats() {
    // 总资源数（所有分类资源求和）
    const totalResources = allResourceData.reduce((sum, category) => {
      return sum + (category.resources?.length || 0);
    }, 0);

    // 各分类资源数及占比（保留1位小数）
    const categoryStats = allResourceData.map(category => {
      const categoryCount = category.resources?.length || 0;
      const percentage = totalResources > 0 ? ((categoryCount / totalResources) * 100).toFixed(1) : '0.0';
      return {
        id: category.id,
        name: category.name,
        count: categoryCount,
        percentage: `${percentage}%`,
        color: category.color // 分类主题色（用于进度条背景）
      };
    });

    // 标签统计（免费/付费/代码生成等标签的资源总数）
    const tagStats = {};
    allResourceData.forEach(category => {
      category.resources?.forEach(resource => {
        resource.tags?.forEach(tag => {
          // 统计每个标签的资源数量（去重：同一资源多个标签不重复计数）
          if (!tagStats[tag]) {
            tagStats[tag] = new Set(); // 用Set避免同一资源重复计数
          }
          tagStats[tag].add(resource.id); // 存储资源ID（唯一标识）
        });
      });
    });
    // 转换为数组格式（便于渲染）
    const formattedTagStats = Object.entries(tagStats).map(([tagName, resourceIds]) => ({
      name: tagName,
      count: resourceIds.size,
      // 标签颜色映射（可根据需求扩展）
      color: tagName === '免费' ? 'green' : 
            tagName === '付费' ? 'orange' : 
            tagName === '代码生成' ? 'blue' : 
            tagName === '文档总结' ? 'purple' : 'gray'
    }));

    return {
      totalResources,    // 总资源数
      categoryStats,     // 各分类统计（名称、数量、占比、颜色）
      formattedTagStats  // 标签统计（名称、数量、颜色）
    };
  }

  // 渲染资源统计区域（填充#resource-stats）
  function renderResourceStats() {
    // 获取统计容器（增加存在性判断，避免报错）
    const statsContainer = document.getElementById('resource-stats');
    if (!statsContainer) return;
    const statsContent = statsContainer.querySelector('div.space-y-2'); // 统计内容的子容器
    if (!statsContent) return;

    // 计算统计数据
    const { totalResources, categoryStats, formattedTagStats } = calculateResourceStats();

    // 生成统计HTML（分3个模块：总资源数、分类占比、标签统计）
    const statsHtml = `
      <!-- 总资源数 -->
      <div class="pb-4 border-b border-gray-100">
        <div class="flex justify-between items-center mb-1">
          <span class="text-gray-600">总资源数</span>
          <span class="font-medium text-gray-800">${totalResources} 个</span>
        </div>
        <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full" style="width: 100%"></div>
        </div>
      </div>

      <!-- 标签统计（显示资源数Top3的标签） -->
      <div class="pt-4">
        <p class="text-gray-600 mb-2 text-sm font-medium">热门标签</p>
        <div class="flex flex-wrap gap-1.5">
          ${formattedTagStats
            .sort((a, b) => b.count - a.count) // 按资源数降序排序
            .slice(0, 5) // 显示前5个热门标签
            .map(tag => `
              <span class="px-2 py-0.5 bg-${tag.color}/10 text-${tag.color}-600 text-xs rounded-full flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-${tag.color}"></span>
                ${tag.name} (${tag.count})
              </span>
            `).join('')}
        </div>
      </div>
    `;

    // 填充统计内容到容器
    statsContent.innerHTML = statsHtml;
  }

  // 初始化加载（入口）
  loadResourceData();
});