from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
NO_REFERRER_IMAGE_PREFIXES = (
    "https://static001.geekbang.org/resource/image",
    "https://static001.geekbang.org/resource/avatar",
    "https://static001-test.geekbang.org/resource/image",
    "https://static001.infoq.cn/resource/image",
    "https://static001.geekbang.org/con",
)
REFERRER_ATTR = '{: referrerpolicy="no-referrer" }'


def ensure_page(path: Path, title: str, body: str) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"# {title}\n\n{body}\n", encoding="utf-8")


def normalize_course_nav(course_dir: Path) -> list:
    config_path = course_dir / "mkdocs.yml"
    docs_dir = course_dir / "docs"
    if not config_path.exists() or not docs_dir.exists():
        return [{"课程首页": str(course_dir.relative_to(DOCS) / "docs/index.md")}]

    data = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}
    nav = data.get("nav") or []
    normalized = []
    for item in nav:
        if isinstance(item, str):
            target = docs_dir / item
            if target.exists():
                normalized.append({Path(item).stem: str(target.relative_to(DOCS))})
        elif isinstance(item, dict):
            for title, value in item.items():
                if isinstance(value, str):
                    target = docs_dir / value
                    if target.exists():
                        normalized.append({title: str(target.relative_to(DOCS))})
    if not normalized and (docs_dir / "index.md").exists():
        normalized.append({"课程首页": str((docs_dir / "index.md").relative_to(DOCS))})
    return normalized


def product_columns_nav() -> list:
    product_root = DOCS / "columns" / "product"
    nav = [{"产品专栏首页": "columns/product/index.md"}]
    if not product_root.exists():
        return nav

    for course_dir in sorted(p for p in product_root.iterdir() if p.is_dir()):
        nav.append({course_dir.name: normalize_course_nav(course_dir)})
    return nav


def add_image_referrer_policy() -> None:
    for md_path in DOCS.rglob("*.md"):
        text = md_path.read_text(encoding="utf-8")
        changed = False
        lines = []
        for line in text.splitlines():
            if (
                "referrerpolicy=" not in line
                and any(prefix in line for prefix in NO_REFERRER_IMAGE_PREFIXES)
                and ("![" in line or "<img" in line)
            ):
                line = f"{line}{REFERRER_ATTR}"
                changed = True
            lines.append(line)

        if changed:
            md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def build_config() -> dict:
    return {
        "site_name": "美少女的成长之路",
        "site_description": "专栏、学习库与我的笔记",
        "site_url": "https://jxh1997.github.io/",
        "docs_dir": "docs",
        "site_dir": "site",
        "use_directory_urls": True,
        "theme": {
            "name": "material",
            "language": "zh",
            "features": [
                "navigation.tabs",
                "navigation.tabs.sticky",
                "navigation.top",
                "navigation.indexes",
                "navigation.instant",
                "navigation.instant.progress",
                "navigation.tracking",
                "toc.follow",
                "content.code.copy",
                "content.tooltips",
            ],
            "palette": [
                {
                    "media": "(prefers-color-scheme: light)",
                    "scheme": "default",
                    "primary": "teal",
                    "accent": "deep orange",
                    "toggle": {
                        "icon": "material/brightness-4",
                        "name": "切换到深色模式",
                    },
                },
                {
                    "media": "(prefers-color-scheme: dark)",
                    "scheme": "slate",
                    "primary": "black",
                    "accent": "amber",
                    "toggle": {
                        "icon": "material/brightness-7",
                        "name": "切换到浅色模式",
                    },
                },
            ],
        },
        "extra_css": ["assets/stylesheets/extra.css"],
        "extra_javascript": [
            "assets/javascripts/referrerpolicy.js",
            "assets/javascripts/reading-state.js",
        ],
        "markdown_extensions": [
            "admonition",
            "tables",
            "attr_list",
            "md_in_html",
            "def_list",
            "pymdownx.details",
            "pymdownx.superfences",
            "pymdownx.inlinehilite",
            {"pymdownx.highlight": {"anchor_linenums": True}},
            {"pymdownx.tabbed": {"alternate_style": True}},
        ],
        "plugins": ["search"],
        "nav": [
            {"首页": "index.md"},
            {
                "专栏": [
                    {"专栏首页": "columns/index.md"},
                    {"产品": product_columns_nav()},
                    {"AI": "columns/ai/index.md"},
                    {"IoT": "columns/iot/index.md"},
                ]
            },
            {
                "学习库": [
                    {"学习库首页": "learning-notes/index.md"},
                    {
                        "产品经理": [
                            {"技术能力": "learning-notes/product-manager/技术能力.md"},
                            {"十阶段学习体系": "learning-notes/product-manager/十阶段学习体系.md"},
                            {"交互设计": "learning-notes/product-manager/交互设计.md"},
                            {"菜单权限": "learning-notes/product-manager/菜单权限.md"},
                            {"按钮权限": "learning-notes/product-manager/按钮权限.md"},
                        ]
                    },
                    {
                        "计算机基础": [
                            {"域名与DNS": "learning-notes/computer-basics/域名与DNS.md"},
                            {"路由与页面状态": "learning-notes/computer-basics/路由与页面状态.md"},
                            {"分页": "learning-notes/computer-basics/分页.md"},
                            {"前端渲染性能": "learning-notes/computer-basics/前端渲染性能.md"},
                            {
                                "懒加载 vs 虚拟列表": "learning-notes/computer-basics/懒加载-vs-虚拟列表.md"
                            },
                        ]
                    },
                    {
                        "系统架构": [
                            {"真删除与伪删除": "learning-notes/architecture/真删除与伪删除.md"},
                            {"异步任务原理": "learning-notes/architecture/异步任务原理.md"},
                            {"第三方系统对接": "learning-notes/architecture/第三方系统对接.md"},
                            {
                                "Redis / 队列 / Nginx": "learning-notes/architecture/Redis-队列-Nginx.md"
                            },
                        ]
                    },
                    {
                        "IoT": [
                            {"配网": "learning-notes/iot/配网.md"},
                            {"设备连接正确云平台": "learning-notes/iot/设备连接正确云平台.md"},
                            {"无厂商账号配网": "learning-notes/iot/无厂商账号配网.md"},
                            {"设备云端注册": "learning-notes/iot/设备云端注册.md"},
                            {"定位权限": "learning-notes/iot/定位权限.md"},
                            {"云平台地址配置": "learning-notes/iot/云平台地址配置.md"},
                            {"4G/有线设备注册": "learning-notes/iot/4G有线设备注册.md"},
                            {"预注册 vs 动态注册": "learning-notes/iot/预注册-vs-动态注册.md"},
                            {"OTA升级": "learning-notes/iot/OTA升级.md"},
                        ]
                    },
                    {
                        "新能源": [
                            {"多数据中心架构设计": "learning-notes/energy/多数据中心架构设计.md"},
                            {"全球化产品设计": "learning-notes/energy/全球化产品设计.md"},
                        ]
                    },
                ]
            },
            {
                "我的笔记": [
                    {"笔记首页": "my-notes/index.md"},
                    {
                        "专栏笔记": [
                            {"索引": "my-notes/column-notes/index.md"},
                        ]
                    },
                    {
                        "工作复盘": [
                            {"索引": "my-notes/work-notes/index.md"},
                            {"OTA平台设计复盘": "my-notes/work-notes/OTA平台设计复盘.md"},
                            {"权限系统设计复盘": "my-notes/work-notes/权限系统设计复盘.md"},
                        ]
                    },
                    {
                        "每日笔记": [
                            {"索引": "my-notes/daily/index.md"},
                        ]
                    },
                ]
            },
        ],
    }


def main() -> None:
    ensure_page(
        DOCS / "index.md",
        "美少女的成长之路",
        """<section class="home-stage">
  <div class="home-copy">
    <p class="home-kicker">A little study room, made only for you</p>
    <h2>美少女的成长之路</h2>
    <p class="home-lead">这里不是任务清单，也不是冷冰冰的资料库。这里放你正在变厉害的证据：读过的专栏、问过的问题、想通的瞬间，还有以后会越来越清楚的自己。</p>
    <div class="home-actions">
      <a href="learning-notes/">继续学习</a>
      <a href="my-notes/">写点想法</a>
    </div>
  </div>

  <aside class="home-note">
    <p class="note-label">给今天的你</p>
    <p>不用一下子什么都懂。产品经理的厉害，是一次次把模糊的问题问清楚，把复杂的事情讲明白。</p>
    <p>这个网站负责替你收好那些认真。</p>
  </aside>
</section>

<section class="home-shelves" aria-label="内容入口">
  <a class="shelf-card shelf-card-a" href="columns/">
    <span class="shelf-index">01</span>
    <span class="shelf-label">专栏</span>
    <strong>外部输入</strong>
    <p>系统课程、专栏文章、成体系的内容都先放在这里。想补基础、找方法、搭框架，就从这里开始。</p>
  </a>

  <a class="shelf-card shelf-card-b" href="learning-notes/">
    <span class="shelf-index">02</span>
    <span class="shelf-label">学习库</span>
    <strong>问答备份</strong>
    <p>那些你向ChatGpt追问过的内容，都按主题放好。忘了没关系，回来就能接上。</p>
  </a>

  <a class="shelf-card shelf-card-c" href="my-notes/">
    <span class="shelf-index">03</span>
    <span class="shelf-label">我的笔记</span>
    <strong>自己消化</strong>
    <p>真正属于你的理解写在这里。工作复盘、判断依据、下次可以复用的方法，都会慢慢长出来。</p>
  </a>
</section>
""",
    )
    ensure_page(DOCS / "columns/index.md", "专栏", "外部输入。这里按照领域和课程归档，尽量保留原始章节顺序。")
    ensure_page(DOCS / "columns/product/index.md", "产品专栏", "这里收纳产品经理相关专栏。")
    ensure_page(DOCS / "columns/ai/index.md", "AI 专栏", "这里可以继续收纳 AI 相关专栏。")
    ensure_page(DOCS / "columns/iot/index.md", "IoT 专栏", "这里可以继续收纳 IoT 相关专栏。")
    ensure_page(DOCS / "learning-notes/index.md", "学习库", "问答备份。这里收纳你通过 ChatGPT 学习和追问得到的内容。")
    ensure_page(
        DOCS / "my-notes/index.md",
        "我的笔记",
        """自己消化。这里不追求完整摘录，而是记录你的理解、判断、复盘和可复用结论。

建议每篇笔记都回答三个问题：

- 我现在解决的是什么问题？
- 这个知识点和我的工作有什么关系？
- 下次遇到类似问题，我可以怎么判断？
""",
    )
    ensure_page(DOCS / "my-notes/column-notes/index.md", "专栏笔记", "阅读专栏后的理解、摘记和延伸问题。")
    ensure_page(DOCS / "my-notes/work-notes/index.md", "工作复盘", "把真实项目里的判断、失误、取舍和复用经验写下来。")
    ensure_page(DOCS / "my-notes/daily/index.md", "每日笔记", "日常学习记录、问题清单和临时想法。")
    ensure_page(
        DOCS / "my-notes/work-notes/OTA平台设计复盘.md",
        "OTA平台设计复盘",
        "## 背景\n\n## 我的判断\n\n## 关键取舍\n\n## 可复用结论\n",
    )
    ensure_page(
        DOCS / "my-notes/work-notes/权限系统设计复盘.md",
        "权限系统设计复盘",
        "## 背景\n\n## 我的判断\n\n## 关键取舍\n\n## 可复用结论\n",
    )
    add_image_referrer_policy()

    config = build_config()
    (ROOT / "mkdocs.yml").write_text(
        yaml.safe_dump(config, allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
