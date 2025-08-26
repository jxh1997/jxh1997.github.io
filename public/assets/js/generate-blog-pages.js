const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');

// 配置路径
// 👇 修正路径：直接基于项目根目录写路径
const PROJECT_ROOT = path.join(__dirname, '../..'); // 定位到根目录
const POSTS_DIR = path.join(PROJECT_ROOT, '_posts'); // Markdown源文件目录
const TEMPLATE_PATH = path.join(PROJECT_ROOT, 'blog/posts/template.html'); // 模板文件路径
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/blog/posts'); // 输出HTML目录
const META_OUTPUT_PATH = path.join(PROJECT_ROOT, 'data/blog-meta.json'); // 元数据输出路径

// 确保输出目录存在
async function ensureDirectories() {
  await fs.ensureDir(OUTPUT_DIR);
  await fs.ensureDir(path.dirname(META_OUTPUT_PATH));
}

// 读取所有Markdown文件并提取元数据
async function getBlogMetadata() {
  const files = await fs.readdir(POSTS_DIR);
  const metadata = [];

  for (const file of files) {
    if (path.extname(file) === '.md') {
      const filePath = path.join(POSTS_DIR, file);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const {
        data
      } = matter(fileContent);

      // 从文件名提取信息（假设文件名格式：YYYY-MM-DD-title.md）
      const fileNameWithoutExt = path.basename(file, '.md');
      const slug = fileNameWithoutExt.replace(/^\d{4}-\d{2}-\d{2}-/, ''); // 移除日期部分

      // 合并元数据（Front Matter优先，文件名提取作为 fallback）
      metadata.push({
        id: metadata.length + 1,
        slug,
        fileName: file,
        title: data.title || fileNameWithoutExt,
        category: data.category || 'general',
        coverImage: data.coverImage || '/assets/images/blog-covers/default.jpg',
        date: data.date || fileNameWithoutExt.slice(0, 10), // 从文件名提取日期
        views: data.views || 0,
        tags: data.tags || [],
        excerpt: data.excerpt || ''
      });
    }
  }

  // 按日期排序（最新的在前）
  return metadata.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 生成单个博客HTML页面
async function generateBlogPage(metadata, templateContent) {
  const outputPath = path.join(OUTPUT_DIR, `${metadata.slug}.html`);
  await fs.writeFile(outputPath, templateContent, 'utf8');
  console.log(`生成博客页面: ${outputPath}`);
}

// 复制静态资源
async function copyStaticAssets() {
  try {
    // 复制博客列表页
    const blogIndexSource = path.join(PROJECT_ROOT, 'blog.html');
    const blogIndexDest = path.join(PROJECT_ROOT, 'public/blog/index.html');
    
    if (await fs.pathExists(blogIndexSource)) {
      await fs.copy(blogIndexSource, blogIndexDest, { overwrite: true });
      console.log(`已复制博客列表页: ${blogIndexDest}`);
    } else {
      console.warn(`警告：博客列表源文件不存在 → ${blogIndexSource}`);
    }

    // 复制 assets 静态资源
    const assetsSource = path.join(PROJECT_ROOT, 'assets');
    const assetsDest = path.join(PROJECT_ROOT, 'public/assets');
    
    if (await fs.pathExists(assetsSource)) {
      await fs.copy(assetsSource, assetsDest, { overwrite: true });
      console.log(`已复制静态资源到: ${assetsDest}`);
    } else {
      console.warn(`警告：静态资源目录不存在 → ${assetsSource}`);
    }
  } catch (error) {
    console.error('复制静态资源失败:', error);
  }
}

// 主函数
async function main() {
  try {
    console.log('开始生成博客页面...');

    // 准备工作
    await ensureDirectories();

    // 读取模板
    const templateContent = await fs.readFile(TEMPLATE_PATH, 'utf8');

    // 获取并保存元数据
    const metadataList = await getBlogMetadata();
    await fs.writeFile(META_OUTPUT_PATH, JSON.stringify(metadataList, null, 2), 'utf8');
    console.log(`已生成元数据: ${META_OUTPUT_PATH}`);

    // 生成所有博客页面
    for (const metadata of metadataList) {
      await generateBlogPage(metadata, templateContent);
    }

    // 复制静态资源
    await copyStaticAssets();

    console.log('博客页面生成完成！');
  } catch (error) {
    console.error('生成博客页面失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main();