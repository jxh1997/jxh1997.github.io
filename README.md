# 美少女的成长之路

这是一个基于 MkDocs Material 的个人知识库，内容分为三块：

- `docs/columns/`：专栏，外部输入，按领域和课程归档。
- `docs/learning-notes/`：学习库，问答备份，按主题和工作场景归档。
- `docs/my-notes/`：我的笔记，自己消化，用来写理解、复盘和可复用结论。

## 本地预览

```bash
python -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python scripts/generate_mkdocs.py
.venv/bin/mkdocs serve
```

打开：

```text
http://127.0.0.1:8000/
```

## 构建检查

```bash
.venv/bin/python scripts/generate_mkdocs.py
.venv/bin/mkdocs build --strict
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
