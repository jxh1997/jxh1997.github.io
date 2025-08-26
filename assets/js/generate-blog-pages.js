const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
// 引入 html-minifier 用于压缩 HTML
const htmlMinifier = require('html-minifier'); 

// 配置路径
const PROJECT_ROOT = path.join(__dirname, '../..'); 
const POSTS_DIR = path.join(PROJECT_ROOT, '_posts'); 
const TEMPLATE_PATH = path.join(PROJECT_ROOT, 'blog/posts/template.html'); 
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/blog/posts'); 
const META_OUTPUT_PATH = path.join(PROJECT_ROOT, 'data/blog-meta.json'); 

// HTML 压缩配置（可根据需求调整）
const htmlMinifierOptions = {
  collapseWhitespace: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true, // 若模板里有 style 标签内 CSS，可压缩
  minifyJS: true, // 若模板里有 script 标签内 JS，可压缩
};

// 确保输出目录存在
async function ensureDirectories() {
  await fs.ensureDir(OUTPUT_DIR);
  await fs.ensureDir(path.dirname(META_OUTPUT_PATH));
}

// 读取所有 Markdown 文件并提取元数据
async function getBlogMetadata() {
  const files = await fs.readdir(POSTS_DIR);
  const metadata = [];

  for (const file of files) {
    if (path.extname(file) === '.md') {
      const filePath = path.join(POSTS_DIR, file);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data } = matter(fileContent);

      const fileNameWithoutExt = path.basename(file, '.md');
      const slug = fileNameWithoutExt.replace(/^\d{4}-\d{2}-\d{2}-/, ''); 

      metadata.push({
        id: metadata.length + 1,
        slug,
        fileName: file,
        title: data.title || fileNameWithoutExt, 
        category: data.category || 'general',
        coverImage: data.coverImage || '/assets/images/blog-covers/default.jpg',
        publishDate: data.publishDate || data.date || fileNameWithoutExt.slice(0, 10), 
        views: data.views || 0,
        tags: data.tags || [],
        excerpt: data.excerpt || ''
      });
    }
  }

  return metadata.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
}

// 生成单个博客 HTML 页面（增加压缩步骤）
async function generateBlogPage(metadata, templateContent) {
  const outputPath = path.join(OUTPUT_DIR, `${metadata.slug}.html`);
  // 压缩 HTML 内容
  const minifiedContent = htmlMinifier.minify(templateContent, htmlMinifierOptions);
  await fs.writeFile(outputPath, minifiedContent, 'utf8');
  console.log(`生成并压缩博客页面: ${outputPath}`);
}

// 复制静态资源
async function copyStaticAssets() {
  try {
    const blogIndexSource = path.join(PROJECT_ROOT, 'blog.html');
    const blogIndexDest = path.join(PROJECT_ROOT, 'public/blog/index.html');
    
    if (await fs.pathExists(blogIndexSource)) {
      let content = await fs.readFile(blogIndexSource, 'utf8');
      // 若需要，也可对博客列表页 HTML 进行压缩
      content = htmlMinifier.minify(content, htmlMinifierOptions); 
      await fs.writeFile(blogIndexDest, content, 'utf8');
      console.log(`已复制并压缩博客列表页: ${blogIndexDest}`);
    } else {
      console.warn(`警告：博客列表源文件不存在 → ${blogIndexSource}`);
    }

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

    await ensureDirectories();

    const templateContent = await fs.readFile(TEMPLATE_PATH, 'utf8');

    const metadataList = await getBlogMetadata();
    await fs.writeFile(META_OUTPUT_PATH, JSON.stringify(metadataList, null, 2), 'utf8');
    console.log(`已生成元数据: ${META_OUTPUT_PATH}`);

    for (const metadata of metadataList) {
      await generateBlogPage(metadata, templateContent);
    }

    await copyStaticAssets();

    console.log('博客页面生成完成！');
  } catch (error) {
    console.error('生成博客页面失败:', error);
    process.exit(1);
  }
}

main();