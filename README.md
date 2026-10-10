# 个人知识库

这是一个基于 MkDocs Material 的个人知识库，顶部导航依次为专栏、学习库、新能源产品。

- `docs/columns/`：专栏，外部输入，按领域和课程归档。
- `docs/learning-notes/`：学习库，问答备份，按主题和工作场景归档。
- `docs/new-energy/`：新能源产品，以 HEMS 知识全景图为首页，按八大领域及学习方向归档。
- `docs/my-notes/`：我的笔记，自己消化，用来写理解、复盘和可复用结论。

新能源产品的学习方向目录已建立，当前仅保留空白占位页。后续在对应目录下新增 Markdown 笔记，再运行 `scripts/generate_mkdocs.py` 即可自动更新导航；带数字前缀的目录按全景图的学习顺序排列。

## 本地预览

```bash
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python scripts/generate_mkdocs.py
.venv/bin/python scripts/preview.py
```

打开：

```text
http://127.0.0.1:8000/
```

预览产物保存在 `.cache/preview/`。首次启动完整构建，后续修改正文、HTML 或静态资源只增量构建；重启后也会复用缓存。新增/删除 Markdown、修改页面标题或元数据、配置或依赖版本变化时，自动完整构建，确保导航正确。全局搜索已关闭。

需要强制刷新全部页面时运行：

```bash
.venv/bin/python scripts/preview.py --clean
```

完整构建与部署仍使用 MkDocs 原生流程，不依赖本地预览缓存。

## 构建检查

```bash
.venv/bin/python scripts/generate_mkdocs.py
.venv/bin/python -m mkdocs build --strict
```

## 部署

推送到 `main` 分支后，GitHub Actions 会执行：

```bash
python scripts/generate_mkdocs.py
mkdocs gh-deploy --force
```

最终站点发布到：

```text
https://jxh1997.github.io/
```

GitHub Pages 需要设置为从 `gh-pages` 分支发布。
