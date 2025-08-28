// DOM元素引用
const headerContainer = document.getElementById('skills-header');
const navContainer = document.getElementById('skills-nav');
const contentContainer = document.getElementById('skills-content');
const expertiseContainer = document.getElementById('expertise-areas');

// 从本地JSON文件加载数据
async function loadSkillsData() {
  try {
    // 从本地目录/data/json获取数据
    const response = await fetch('/data/skills.json');

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('加载技能数据失败:', error);
    showError();
    return null;
  }
}

// 显示错误信息
function showError() {
  // 清空所有容器并显示错误信息
  headerContainer.innerHTML = `
    <div class="error-message">
      <i class="fa fa-exclamation-triangle text-yellow-500 text-2xl mb-2"></i>
      <p>数据加载失败</p>
    </div>
  `;

  navContainer.innerHTML = '';
  contentContainer.innerHTML = '';
  expertiseContainer.innerHTML = '';
}

// 渲染标题区域
function renderHeader(data) {
  headerContainer.innerHTML = `
    <h2 class="text-[clamp(1.8rem,4vw,2.5rem)] font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
      ${data.sectionTitle}
    </h2>
    <div class="w-20 h-1 bg-primary mx-auto rounded-full"></div>
    <p class="mt-4 text-gray-600 max-w-2xl mx-auto">
      ${data.sectionSubtitle}
    </p>
  `;
}

// 渲染导航区域
function renderNav(data) {
  navContainer.innerHTML = ''; // 清空骨架屏

  data.categories.forEach(category => {
    const isActive = category.id === 'core'; // 默认激活第一个分类
    const navButton = document.createElement('button');
    navButton.className = `skill-nav px-5 py-2 rounded-full font-medium transition-all duration-300 ${
      isActive 
        ? 'active bg-primary text-white hover:shadow-md' 
        : 'bg-gray-100 hover:bg-gray-200 hover:shadow-sm'
    }`;
    navButton.dataset.category = category.id;
    navButton.textContent = category.name;
    navButton.addEventListener('click', handleNavClick);
    navContainer.appendChild(navButton);
  });
}

// 渲染技能内容区域
function renderContent(data) {
  contentContainer.innerHTML = ''; // 清空骨架屏

  data.categories.forEach(category => {
    const isActive = category.id === 'core'; // 默认显示第一个分类
    const categoryDiv = document.createElement('div');
    categoryDiv.className = `skill-category ${isActive ? 'active' : 'hidden'}`;
    categoryDiv.id = `${category.id}-category`;

    // 根据卡片数量决定网格布局
    const gridColumns = category.cards.length === 3 ?
      'grid-cols-1 md:grid-cols-3' :
      'grid-cols-1 md:grid-cols-2';

    categoryDiv.innerHTML = `
      <div class="grid ${gridColumns} gap-6">
        ${category.cards.map(card => renderCard(card)).join('')}
      </div>
    `;

    contentContainer.appendChild(categoryDiv);
  });

  // 初始化默认显示的分类动画
  const defaultCategory = document.querySelector('.skill-category.active');
  if (defaultCategory) {
    defaultCategory.style.opacity = '0';
    setTimeout(() => {
      defaultCategory.style.transition = 'opacity 0.3s ease';
      defaultCategory.style.opacity = '1';
    }, 100);
  }
}

// 渲染单个技能卡片
function renderCard(card) {
  return `
    <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 card-hover">
      <div class="bg-primary/5 p-4 border-b border-gray-100">
        <h3 class="font-semibold flex items-center text-gray-800">
          ${renderIconByType(card.icon)}
          <span class="ml-2">${card.title}</span>
        </h3>
      </div>
      <div class="p-5">
        <ul class="space-y-3">
          ${card.skills.map(skill => renderSkill(skill)).join('')}
        </ul>
        
        <div class="mt-4 pt-4 border-t border-gray-100">
          <h4 class="text-sm font-medium mb-2 text-gray-800">${card.examplesTitle}</h4>
          <p class="text-xs text-gray-600">
            ${card.examples}
          </p>
        </div>
      </div>
    </div>
  `;
}

// 渲染单个技能项
function renderSkill(skill) {
  const levelClass = skill.levelType === 'green' ?
    'bg-green-100 text-green-700' :
    'bg-blue-100 text-blue-700';

  return `
    <li class="flex justify-between items-center">
      <span class="flex items-center text-gray-700">
        <i class="fa fa-check-circle text-primary mr-2"></i>
        ${skill.name}
      </span>
      <span class="px-2 py-0.5 ${levelClass} text-xs rounded">${skill.level}</span>
    </li>
  `;
}

// 渲染擅长领域
function renderExpertiseAreas(data) {
  expertiseContainer.className = 'bg-white rounded-xl shadow-sm p-6 md:p-8 border border-gray-100 mt-6';
  expertiseContainer.innerHTML = `
    <h3 class="text-lg font-semibold mb-6 text-gray-800">技术擅长领域</h3>
    <div class="flex flex-wrap gap-4 md:gap-6">
      ${data.expertiseAreas.map(area => `
        <div class="flex items-center p-3 md:p-4 bg-primary/5 rounded-lg transition-all duration-300 hover:bg-primary/10">
          <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
            ${renderIconByType(area.icon)}
          </div>
          <div>
            <h4 class="font-medium text-sm text-gray-800">${area.title}</h4>
            <p class="text-xs text-gray-500">${area.description}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * 根据icon字段类型渲染图标
 * @param {string} iconValue - JSON中的icon字段值（可能是fa-xxx或SVG字符串）
 * @returns {string} 图标HTML字符串
 */
function renderIconByType(iconValue) {
  // 1. 若为null/undefined，显示默认SVG
  if (!iconValue || typeof iconValue !== 'string') {
    return `
      <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
    `;
  }

  // 2. 若以"fa-"开头，渲染Font Awesome图标
  if (iconValue.trim().startsWith('fa-')) {
    return `<i class="fa ${iconValue.trim()} text-primary"></i>`;
  }

  // 3. 若包含SVG标签，直接渲染SVG（自动适配尺寸）
  if (iconValue.includes('<svg')) {
    // 处理SVG：添加尺寸类+继承颜色，避免样式错乱
    return iconValue
      .replace(/<svg([^>]*)>/, (match, attr) => {
        // 保留原有属性，新增尺寸类和颜色继承
        const hasClass = attr.includes('class=');
        const hasFill = attr.includes('fill=');
        const hasStroke = attr.includes('stroke=');

        return `<svg 
          ${attr}
          ${!hasClass ? 'class="w-5 h-5"' : ''}
          ${!hasFill ? 'fill="currentColor"' : ''}
          ${!hasStroke ? 'stroke="currentColor"' : ''}
        >`;
      })
      .replace(/<\/svg>/, '</svg>');
  }

  // 4. 其他情况（如普通文本），显示默认SVG
  return `
    <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
    </svg>
  `;
}

// 导航点击事件处理
function handleNavClick(e) {
  const targetCategoryId = e.currentTarget.dataset.category;

  // 更新导航样式
  document.querySelectorAll('.skill-nav').forEach(nav => {
    nav.classList.remove('active', 'bg-primary', 'text-white');
    nav.classList.add('bg-gray-100');
  });
  e.currentTarget.classList.add('active', 'bg-primary', 'text-white');
  e.currentTarget.classList.remove('bg-gray-100');

  // 显示对应的分类内容（带动画）
  const targetCategory = document.getElementById(`${targetCategoryId}-category`);
  const allCategories = document.querySelectorAll('.skill-category');

  allCategories.forEach(cat => {
    if (cat !== targetCategory) {
      cat.classList.add('hidden');
      cat.classList.remove('active');
      cat.style.opacity = '0';
    } else {
      cat.classList.remove('hidden');
      cat.classList.add('active');
      // 强制重绘触发动画
      cat.style.opacity = '0';
      setTimeout(() => {
        cat.style.transition = 'opacity 0.3s ease';
        cat.style.opacity = '1';
      }, 10);
    }
  });
}

// 初始化渲染
async function init() {
  const skillsData = await loadSkillsData();
  if (skillsData) {
    renderHeader(skillsData);
    renderNav(skillsData);
    renderContent(skillsData);
    renderExpertiseAreas(skillsData);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);