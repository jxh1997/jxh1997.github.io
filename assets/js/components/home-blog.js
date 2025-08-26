// /assets/js/components/home-blogs.js
document.addEventListener('DOMContentLoaded', async () => {
  const blogCardsContainer = document.getElementById('home-blog-cards');
  if (!blogCardsContainer) return;

  // 显示加载动画（可选，保持体验一致）
  blogCardsContainer.innerHTML = `
    <div class="col-span-full text-center py-6">
      <i class="fa fa-spinner fa-spin text-primary text-xl mb-3"></i>
      <p class="text-gray-600">加载最新博客...</p>
    </div>
  `;

  try {
    // 复用博客数据
    const response = await fetch('data/blog-meta.json');
    if (!response.ok) throw new Error('博客数据加载失败');
    const blogs = await response.json();

    // 排序取最新 3 篇
    const sortedBlogs = blogs
      .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
      .slice(0, 3);

    // 渲染卡片
    blogCardsContainer.innerHTML = '';
    sortedBlogs.forEach(blog => {
      const cardHtml = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 transition-transform hover:-translate-y-1">
          <!-- 封面图 + 加载失败降级 -->
          <div class="relative">
            <img 
              src="${blog.coverImage || 'assets/images/blog-covers/default.jpg'}" 
              alt="${blog.title}" 
              class="w-full h-40 md:h-48 object-cover"
              onerror="this.src='assets/images/blog-covers/default.jpg'; this.alt='默认封面'"
            >
            <!-- 分类标签 -->
            <span class="absolute top-2 left-2 px-2 py-1 text-xs font-medium text-white bg-primary/80 rounded">
              ${blog.category || '未分类'}
            </span>
          </div>
          <!-- 内容区 -->
          <div class="p-4 md:p-6">
            <h3 class="text-lg md:text-xl font-semibold mb-2 hover:text-primary transition-colors">
              <a href="/public/blog/posts/${blog.slug}.html">${blog.title}</a>
            </h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">
              ${blog.excerpt || '暂无摘要...'}
            </p>
            <div class="flex items-center justify-between">
              <!-- 日期 -->
              <div class="flex items-center gap-2 text-gray-500 text-xs md:text-sm">
                <i class="fa fa-calendar-o"></i> ${new Date(blog.publishDate || blog.date).toLocaleDateString('zh-CN', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
              <!-- 阅读按钮 -->
              <a href="/public/blog/posts/${blog.slug}.html" class="text-primary text-sm font-medium hover:underline">
                阅读全文 →
              </a>
            </div>
          </div>
        </div>
      `;
      blogCardsContainer.insertAdjacentHTML('beforeend', cardHtml);
    });

  } catch (error) {
    blogCardsContainer.innerHTML = `
      <div class="col-span-full text-center py-6">
        <i class="fa fa-exclamation-circle text-red-500 text-xl mb-3"></i>
        <p class="text-gray-600">博客加载失败：${error.message}</p>
      </div>
    `;
    console.error('首页博客加载错误：', error);
  }
});