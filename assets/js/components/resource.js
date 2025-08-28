// 资源汇总页核心脚本（优化版：图标逻辑简化）
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
    return allResourceData[0]?.id || 'toolbox';
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

      // 简化图标处理：仅补全SVG闭合标签+添加统一类，不修改JSON定义的标签结构
      const processedData = processIcons(data.categories);
      
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
        // 重试按钮事件绑定（增加存在性判断）
        const retryBtn = document.getElementById('retry-load');
        retryBtn && retryBtn.addEventListener('click', loadResourceData);
      }
      console.error('资源加载错误:', error);
    }
  }

  /**
   * 图标处理简化版：仅做必要兼容，不修改JSON定义的标签结构
   * 支持：JSON中直接定义的<i>（含fa）、<svg>、<img>标签
   * 核心：补全SVG闭合标签+添加统一控制类，保留原始标签属性
   * @param {Array} categories - 含图标信息的分类数组
   * @returns {Array} 处理后的分类数组
   */
  function processIcons(categories) {
    // 防御性处理：确保输入是数组
    if (!Array.isArray(categories)) return [];

    // 单个图标处理：仅补全SVG+加统一类
    const processSingleIcon = (icon, color = '') => {
      if (typeof icon !== 'string') return icon;

      // 1. 处理SVG图标：补全闭合标签+添加统一类（不覆盖原有class）
      if (icon.includes('<svg')) {
        let processedSvg = icon;
        // 补全未闭合的SVG标签
        if (!processedSvg.includes('</svg>')) {
          processedSvg += '</svg>';
        }
        // 追加统一类（不替换原有class）
        const colorClass = color ? `icon--color-${color.replace('#', 'hex-')}` : '';
        return processedSvg.replace(
          '<svg', 
          `<svg class="icon icon--svg ${colorClass}"`
        );
      }

      // 2. 处理<img>图标：添加统一类（确保尺寸控制）
      if (icon.includes('<img')) {
        return icon.replace(
          '<img', 
          `<img class="icon icon--img" style="object-fit: contain;"`
        );
      }

      // 3. 处理<i>图标（含fa）：添加统一类（不修改原有class）
      if (icon.includes('<i')) {
        const colorStyle = color ? `style="color: ${color};"` : '';
        return icon.replace(
          '<i', 
          `<i ${colorStyle}`
        );
      }

      // 4. 未知类型：直接返回（避免破坏自定义内容）
      return icon;
    };

    // 批量处理分类及子项图标
    return categories.map(category => {
      const processedCategory = { ...category };

      // 处理分类自身图标（支持color字段控制颜色）
      if (processedCategory.icon) {
        processedCategory.icon = processSingleIcon(processedCategory.icon, processedCategory.color);
      }

      // 处理分类下的resources子项图标
      if (processedCategory.resources && Array.isArray(processedCategory.resources)) {
        processedCategory.resources = processedCategory.resources.map(resource => {
          const processedResource = { ...resource };
          // 子项图标优先用自身color，无则继承分类color
          const resourceColor = processedResource.color || processedCategory.color;
          if (processedResource.icon) {
            processedResource.icon = processSingleIcon(processedResource.icon, resourceColor);
          }
          // 资源无图标时，默认一个完整<i>标签（符合JSON定义逻辑）
          if (!processedResource.icon) {
            processedResource.icon = '<i class="fa fa-link text-gray-400"></i>';
          }
          return processedResource;
        });
      }

      // 处理分类下的skills子项图标（兼容多层级结构）
      if (processedCategory.skills && Array.isArray(processedCategory.skills)) {
        processedCategory.skills = processedCategory.skills.map(skill => {
          const processedSkill = { ...skill };
          const skillColor = processedSkill.color || processedCategory.color;
          if (processedSkill.icon) {
            processedSkill.icon = processSingleIcon(processedSkill.icon, skillColor);
          }
          return processedSkill;
        });
      }

      return processedCategory;
    });
  }

  // 校准统计数据
  function calibrateCategoryStats(categories) {
    return categories.map(category => {
      const realTotal = category.resources?.length || 0;
      const tagStats = category.tags?.map(tag => ({
        ...tag,
        count: tag.id === 'all' ? realTotal : category.resources?.filter(res => res.tags?.includes(tag.id)).length || 0
      })) || [];
      return {
        ...category,
        total: realTotal,
        tags: tagStats
      };
    });
  }

  // 渲染左侧分类导航（简化图标逻辑：直接使用JSON定义的图标）
  function renderCategorySidebar() {
    if (!categoryList) return;
    categoryList.innerHTML = '';

    allResourceData.forEach(category => {
      const isActive = category.id === activeCategoryId;

      console.log(2222, category);
      
      // 直接使用JSON定义的图标，仅添加尺寸控制样式
      let iconHtml = '';
      if (category.icon.includes('<svg')) {
        // SVG图标：统一尺寸（不修改原有属性，仅追加内联样式）
        iconHtml = category.icon.replace('<svg class="icon icon--svg', `<svg class="icon icon--svg" style="width:18px; height:18px;"`);
      } else if (category.icon.includes('<img')) {
        // IMG图标：统一尺寸
        iconHtml = category.icon.replace('<img class="icon icon--img', `<img class="icon icon--img" style="width:18px; height:18px;"`);
      } else {
        // <i>图标：保持原有样式，无需额外处理
        iconHtml = category.icon;
      }

      const categoryItem = document.createElement('li');
      categoryItem.innerHTML = `
        <a href="#${category.id}" class="category-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors ${isActive ? 'active bg-primary/5 text-primary' : ''}" data-category="${category.id}">
          <div class="w-5 text-center">${iconHtml}</div>
          <span class="flex-1">${escapeHtml(category.name)}</span>
          <span class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">${category.total}</span>
        </a>
      `;
      categoryList.appendChild(categoryItem);
    });

    bindCategoryClick();
  }

  // 渲染当前分类（图标逻辑简化：直接使用JSON定义的完整标签）
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

    // 分类标题图标：直接使用JSON定义，仅调整尺寸
    let categoryIcon = '';
    if (currentCategory.icon.includes('<svg')) {
      categoryIcon = currentCategory.icon.replace('<svg class="icon icon--svg', `<svg class="icon icon--svg" style="width:28px; height:28px;"`);
    } else if (currentCategory.icon.includes('<img')) {
      categoryIcon = currentCategory.icon.replace('<img class="icon icon--img', `<img class="icon icon--img" style="width:28px; height:28px;"`);
    } else {
      categoryIcon = currentCategory.icon;
    }

    // 资源卡片渲染（图标直接用JSON定义）
    const resourceCards = currentCategory.resources?.map(resource => {
      // 资源图标：直接使用JSON定义，调整卡片内尺寸
      let resourceIcon = '';
      if (resource.icon.includes('<svg')) {
        resourceIcon = resource.icon.replace('<svg class="icon icon--svg', `<svg class="icon icon--svg" style="width:20px; height:20px;"`);
      } else if (resource.icon.includes('<img')) {
        resourceIcon = resource.icon.replace('<img class="icon icon--img', `<img class="icon icon--img" style="width:20px; height:20px;"`);
      } else {
        resourceIcon = resource.icon;
      }

      // HTML转义（仅处理文本内容，图标标签不转义）
      const safeName = escapeHtml(resource.name);
      const safeDesc = escapeHtml(resource.description || '暂无描述');
      // 标签渲染
      const tagHtml = resource.tags?.map(tag => {
        const safeTag = escapeHtml(tag);
        if (tag === '免费') {
          return `<span class="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">${safeTag}</span>`;
        } else if (tag === '付费') {
          return `<span class="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full">${safeTag}</span>`;
        } else {
          return `<span class="px-2 py-0.5 bg-${currentCategory.color}/10 text-${currentCategory.color} text-xs rounded-full">${safeTag}</span>`;
        }
      }).join('') || '';

      // 资源卡片HTML（闭合逻辑）
      return `
        <div class="resource-card bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1" data-resource-id="${resource.id || resource.name}">
          <div class="p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-${currentCategory.color}/10 flex items-center justify-center">
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
    }).join('') || '';

    // 拼接完整分类HTML
    resourceContainer.innerHTML = `
      <div class="resource-section">
        <div class="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold mb-2 flex items-center gap-2">
              <div>${categoryIcon}</div>
              <span>${escapeHtml(currentCategory.name)}</span>
            </h2>
            <p class="text-gray-600 text-sm">${escapeHtml(currentCategory.description || '提供丰富的相关资源，满足您的使用需求')}</p>
          </div>
          <span class="text-gray-500 text-sm mt-2 md:mt-0 flex items-center gap-1">
            <i class="fa fa-database"></i> 共 ${currentCategory.total} 个全量资源
          </span>
        </div>

        <div class="flex flex-wrap gap-2 mb-6">
        ${currentCategory.tags?.map(tag => {
          const isActive = tag.id === 'all';
          return `
            <button class="tag-filter flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                isActive ? 'active bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
            }" data-category="${categoryId}" data-tag="${tag.id}" ${tag.count === 0 && tag.id !== 'all' ? 'disabled' : ''}>
                ${escapeHtml(tag.name)}
                <span class="text-xs opacity-80">(${tag.count})</span>
            </button>
            `;
          }).join('') || ''}
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

  // 绑定分类点击
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

        // 移动端关闭导航
        if (mobileCategoryBtn && categorySidebar) {
          categorySidebar.classList.add('hidden');
          const icon = mobileCategoryBtn.querySelector('i');
          icon?.classList.replace('fa-times', 'fa-bars');
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

  // 绑定标签筛选
  function bindTagFilterClick() {
    const tagFilters = document.querySelectorAll('.tag-filter');
    tagFilters.forEach(tag => {
      // 禁用无资源的标签
      const tagCount = tag.querySelector('span')?.textContent.replace(/[()]/g, '') || '0';
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
        const resourceCards = document.querySelectorAll(`.resource-card`);
        resourceCards.forEach(card => {
          const resourceId = card.getAttribute('data-resource-id');
          const resource = currentCategory.resources?.find(r => (r.id || r.name) === resourceId);
          if (!resource) return;

          if (tagId === 'all' || resource.tags?.includes(tagId)) {
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

  // 复制链接
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

  // 搜索功能（图标逻辑简化：直接使用JSON定义的图标）
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchValue = searchInput.value.trim().toLowerCase();
      if (!searchValue) {
        isSearching = false;
        searchCount?.classList.add('hidden');
        renderCurrentCategory(activeCategoryId);
        return;
      }

      isSearching = true;
      let matchCount = 0;
      if (!resourceContainer) return;
      resourceContainer.innerHTML = '';

      allResourceData.forEach(category => {
        // 筛选匹配的资源
        const matchedResources = category.resources?.filter(resource => {
          const matchName = resource.name?.toLowerCase().includes(searchValue) || false;
          const matchDesc = (resource.description || '').toLowerCase().includes(searchValue) || false;
          const matchTag = resource.tags?.some(tag => tag.toLowerCase().includes(searchValue)) || false;
          return matchName || matchDesc || matchTag;
        }) || [];

        if (matchedResources.length === 0) return;
        matchCount += matchedResources.length;

        // 分类图标：直接使用JSON定义，调整尺寸
        let categoryIcon = '';
        if (category.icon.includes('<svg')) {
          categoryIcon = category.icon.replace('<svg class="icon icon--svg', `<svg class="icon icon--svg" style="width:20px; height:20px;"`);
        } else if (category.icon.includes('<img')) {
          categoryIcon = category.icon.replace('<img class="icon icon--img', `<img class="icon icon--img" style="width:20px; height:20px;"`);
        } else {
          categoryIcon = category.icon;
        }

        // 生成匹配资源HTML
        const matchedHtml = `
          <div class="resource-section mb-10">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <div>${categoryIcon}</div>
              <span>${escapeHtml(category.name)}（匹配 ${matchedResources.length} 个）</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${matchedResources.map(resource => {
                // 资源图标：直接使用JSON定义，调整尺寸
                let resourceIcon = '';
                if (resource.icon.includes('<svg')) {
                  resourceIcon = resource.icon.replace('<svg class="icon icon--svg', `<svg class="icon icon--svg" style="width:20px; height:20px;"`);
                } else if (resource.icon.includes('<img')) {
                  resourceIcon = resource.icon.replace('<img class="icon icon--img', `<img class="icon icon--img" style="width:20px; height:20px;"`);
                } else {
                  resourceIcon = resource.icon;
                }

                // 搜索高亮+HTML转义（仅文本内容）
                const safeName = highlightMatch(escapeHtml(resource.name), searchValue);
                const safeDesc = highlightMatch(escapeHtml(resource.description || '暂无描述'), searchValue);

                // 标签渲染
                const tagHtml = resource.tags?.map(tag => {
                  const safeTag = highlightMatch(escapeHtml(tag), searchValue);
                  if (tag === '免费') {
                    return `<span class="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">${safeTag}</span>`;
                  } else if (tag === '付费') {
                    return `<span class="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs rounded-full">${safeTag}</span>`;
                  } else {
                    return `<span class="px-2 py-0.5 bg-${category.color}/10 text-${category.color} text-xs rounded-full">${safeTag}</span>`;
                  }
                }).join('') || '';

                // 资源卡片HTML
                return `
                  <div class="resource-card bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div class="p-5">
                      <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-lg bg-${category.color}/10 flex items-center justify-center">
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
              }).join('')}
            </div>
          </div>
        `;
        resourceContainer.insertAdjacentHTML('beforeend', matchedHtml);
      });

      // 更新搜索统计
      if (searchCount) {
        searchCount.textContent = `找到 ${matchCount} 个相关资源`;
        searchCount.classList.remove('hidden');
        searchCount.className = 'fixed top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm shadow-md z-40';
      }

      // 无匹配结果
      if (matchCount === 0 && resourceContainer) {
        resourceContainer.innerHTML = `
          <div class="text-center py-16 bg-gray-50 rounded-xl border border-gray-100">
            <i class="fa fa-search text-5xl text-gray-200 mb-4"></i>
            <p class="text-gray-500 mb-2">未找到与“ ${escapeHtml(searchValue)}” 相关的资源</p>
            <p class="text-gray-400 text-sm">建议尝试其他关键词或查看全部分类</p>
          </div>
        `;
      }

      // 绑定复制事件
      setTimeout(() => bindCopyLinkClick(), 100);
    });
  }

  // 辅助函数：滚动到分类
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

  // 辅助函数：HTML转义（仅处理文本内容，图标标签不转义）
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 搜索高亮
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