# 高级产品经理成长之路

## 📁 文件结构
```
知识库提问内容/
├── index.html              # 主页面（目录 + 渲染器）
└── _posts/                 # 所有md文件放这里
    ├── 1.md
    ├── 2.md
    └── ... 25.md
```

## ✨ 功能特性
|功能			|说明							|
|:-:			|:-:							|
|左侧目录		|6个篇章分组，26个知识节点		|
|点击切换		|点击目录项动态加载对应md文件	|
|面包屑导航		|显示当前位置：篇章 / 文章名	|
|搜索过滤		|搜索框实时过滤目录				|
|Markdown渲染	|使用 marked.js + highlight.js	|
|代码高亮		|支持JS/Python/SQL/Bash语法高亮	|
|响应式			|移动端侧边栏可收起				|
|加载状态		|加载中显示旋转动画				|

## 📝 后续新增内容步骤
1. 将新的md文件放入 `_posts/` 目录
2. 打开 `index.html`，找到 `navConfig` 配置数组
3. 在对应篇章的 `items` 中添加一项：

```JavaScript
{ title: "文章标题", file: "文件名.md" }
```
## 🖥️ 预览地址
本地服务器已启动，访问：[http://localhost:8080/index.html](http://localhost:8080/index.html)

线上服务器已启动，访问：[https://jxh1997.github.io/](https://jxh1997.github.io/)