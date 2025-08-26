// 确保DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
  console.log('✅ DOM加载完成，开始执行导航逻辑');

  // 配置项与全局变量
  const CONFIG = {
    MAX_RETRY: 5,          // 最多重试次数
    RETRY_INTERVAL: 1000,  // 重试间隔（毫秒）
    NAV_SELECTOR: '#navbar-container', // 导航栏容器选择器
    MENU_TOGGLE_ID: 'menu-toggle',     // 汉堡按钮ID
    MOBILE_MENU_ID: 'mobile-menu',      // 移动端菜单ID
    SCROLL_OFFSET: 120,     // 滚动匹配锚点时的偏移量（避免导航栏遮挡锚点区域顶部）
  };
  let retryCount = 0; // 重试计数器
  let currentPath = '';
  // 导航栏核心元素
  let navbar, navLinks, menuToggle, mobileMenu;
  // 存储“锚点-区域”映射（如 #about → <div id="about">）
  let anchorSections = new Map();

  // 路径处理
  /**
   * 获取当前页面的纯净路径（不含URL参数）
   * @returns {string} 纯净路径（如index.html、projects.html）
   */
  const getCurrentPath = () => {
    const pathName = window.location.pathname.split('/').pop().split('?')[0] || 'index.html';
    const hash = window.location.hash;
    return pathName + hash;
  };

  // 初始化“锚点-区域”映射（从导航链接中提取锚点，对应页面中的区域）
  const initAnchorSections = () => {
    anchorSections.clear(); // 清空旧映射
    navLinks.forEach(link => {
      const linkHref = link.getAttribute('href');
      if (!linkHref.includes('#')) return; // 过滤无锚点的链接（如首页）
      
      const linkHash = linkHref.slice(linkHref.indexOf('#')); // 提取锚点（如 #about）
      const section = document.querySelector(linkHash); // 找到对应的页面区域（如 <div id="about">）
      if (section) {
        anchorSections.set(linkHash, section); // 存储映射：#about → 区域元素
      }
    });
  };

  /**
   * 滚动时判断当前可视区域的锚点，同步更新导航高亮
   */
  const syncNavHighlightOnScroll = utils.throttle(() => {
    if (anchorSections.size === 0) return; // 无锚点区域则跳过

    let currentActiveHash = '';
    const windowTop = window.scrollY + CONFIG.SCROLL_OFFSET; // 加偏移量，提前匹配

    // 遍历所有锚点区域，判断哪个区域在当前可视顶部
    anchorSections.forEach((section, hash) => {
      const sectionTop = section.offsetTop; // 区域顶部距离页面顶部的距离
      const sectionHeight = section.offsetHeight; // 区域高度
      // 条件：区域顶部 ≤ 窗口顶部 < 区域底部（表示区域在可视范围内）
      if (sectionTop <= windowTop && windowTop < sectionTop + sectionHeight) {
        currentActiveHash = hash; // 记录当前可视区域的锚点
      }
    });

    // 如果当前可视锚点变化，更新URL锚点并触发高亮
    if (currentActiveHash && window.location.hash !== currentActiveHash) {
      // 用replaceState避免添加历史记录（可选，也可用pushState保留历史）
      window.history.replaceState(null, null, window.location.pathname + currentActiveHash);
      updateCurrentPathAndHighlight(); // 重新高亮
    }
  });

  /**
   * 高亮当前页面的导航链接（根据最新currentPath更新）
   */
  const highlightCurrentPage = () => {
    if (!navLinks.length) return;
    navLinks.forEach(link => {
      link.classList.remove('text-primary', 'active');
      const linkHref = link.getAttribute('href');
      if (!linkHref) return;

      // 解析链接的完整路径（与getCurrentPath逻辑一致，确保匹配规则统一）
      const linkPathName = linkHref.split('/').pop().split('?')[0] || 'index.html';
      const linkHash = linkHref.includes('#') ? linkHref.slice(linkHref.indexOf('#')) : '';
      const linkFullPath = linkPathName;
      
      // 匹配规则：当前完整路径 === 链接完整路径
      if (currentPath === linkFullPath) {
        link.classList.add('text-primary', 'active');
      }
    });
  };

  /**
   * 更新路径并重新执行高亮
   */
  const updateCurrentPathAndHighlight = () => {
    currentPath = getCurrentPath(); // 重新获取最新路径（含锚点）
    highlightCurrentPage(); // 用最新路径重新高亮
  };

  /**
   * 移动端菜单切换（显示/隐藏）
   */
  const toggleMobileMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.toggle('hidden');
    const icon = menuToggle.querySelector('i');
    // 简化图标切换逻辑（用classList.replace更简洁）
    icon.classList.replace(
      mobileMenu.classList.contains('hidden') ? 'fa-times' : 'fa-bars',
      mobileMenu.classList.contains('hidden') ? 'fa-bars' : 'fa-times'
    );
  };

  /**
   * 导航栏滚动样式变化（滚动超过100px加背景和阴影）
   */
  const updateNavbarOnScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 100) {
      navbar.classList.add('bg-white', 'shadow-md', 'py-2');
      navbar.classList.remove('py-4');
    } else {
      navbar.classList.remove('bg-white', 'shadow-md', 'py-2');
      navbar.classList.add('py-4');
    }
  };

  /**
   * 绑定所有导航栏事件（元素存在时才执行）
   */
  const bindNavbarEvents = () => {
    // 移动端菜单点击事件（避免重复绑定，先移除再添加）
    if (menuToggle) {
      menuToggle.removeEventListener('click', toggleMobileMenu);
      menuToggle.addEventListener('click', toggleMobileMenu);
    }

    // 滚动监听事件（节流处理，避免重复绑定）
    window.removeEventListener('scroll', utils.throttle(updateNavbarOnScroll));
    window.addEventListener('scroll', utils.throttle(updateNavbarOnScroll));

    // 点击导航链接关闭移动端菜单
    if (navLinks.length && mobileMenu) {
      navLinks.forEach(link => {
        link.removeEventListener('click', closeMobileMenuOnLinkClick);
        link.addEventListener('click', closeMobileMenuOnLinkClick);
      });
    }

    // 监听锚点路由变化（hashchange事件）
    window.removeEventListener('hashchange', updateCurrentPathAndHighlight);
    window.addEventListener('hashchange', updateCurrentPathAndHighlight);

    // 滚动同步高亮
    window.removeEventListener('scroll', syncNavHighlightOnScroll);
    window.addEventListener('scroll', syncNavHighlightOnScroll);

    // 新增：窗口 resize 时重新初始化锚点（避免布局变化导致位置不准）
    window.removeEventListener('resize', initAnchorSections);
    window.addEventListener('resize', initAnchorSections);
  };

  /**
   * 点击导航链接后关闭移动端菜单
   */
  const closeMobileMenuOnLinkClick = () => {
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
      const icon = menuToggle?.querySelector('i');
      icon?.classList.replace('fa-times', 'fa-bars');
    }
  };

  /**
   * 尝试获取导航栏元素，失败则重试
   */
  const tryGetNavbar = () => {
    // 更新元素引用（重试时重新查询DOM）
    navbar = document.querySelector(CONFIG.NAV_SELECTOR);
    navLinks = navbar ? navbar.querySelectorAll('a') : []; // 从导航栏内找链接，避免全局污染
    menuToggle = document.getElementById(CONFIG.MENU_TOGGLE_ID);
    mobileMenu = document.getElementById(CONFIG.MOBILE_MENU_ID);

    // 元素全部就绪 → 执行完整初始化
    if (navbar && menuToggle && mobileMenu) {
      // highlightCurrentPage();    // 高亮当前页

      initAnchorSections(); // 初始化“锚点-区域”映射（关键）
      updateCurrentPathAndHighlight(); // 初始路径+高亮
      updateNavbarOnScroll(); // 初始滚动样式
      bindNavbarEvents(); // 绑定所有事件（含滚动同步）
      syncNavHighlightOnScroll(); // 初始滚动位置匹配（如直接访问 index.html#about）
      return;
    }

    // 元素未就绪 → 重试（未超时则继续）
    if (retryCount < CONFIG.MAX_RETRY) {
      retryCount++;
      console.log(`⚠️ 第 ${retryCount} 次重试获取导航栏元素（间隔${CONFIG.RETRY_INTERVAL}ms）`);
      setTimeout(tryGetNavbar, CONFIG.RETRY_INTERVAL);
      return;
    }
  };

  // 启动初始化（入口）
  tryGetNavbar();
});