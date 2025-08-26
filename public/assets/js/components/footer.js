// footer.js - Footer 组件动态逻辑
class FooterComponent {
  constructor() {
    // 配置：替换为你的 GitHub 用户名和仓库名（关键！）
    this.githubConfig = {
      owner: "jxh1997", // 如 "jingxuehui"
      repo: "jxh1997.github.io" // 如 "jxh1997.github.io"
    };
    // DOM 元素
    this.footerContainer = document.getElementById("footer-container");
    this.yearElement = document.getElementById("footer-year");
    this.lastUpdateElement = document.getElementById("footer-last-update");
  }

  // 1. 初始化：执行所有逻辑
  init() {
    console.log(3333, this.footerContainer);
    
    if (!this.footerContainer) return; // 组件未加载则终止
    this.fillCurrentYear(); // 填充当前年份
    this.fetchGithubLastUpdate(); // 获取 GitHub 最后更新时间
  }

  // 2. 自动填充当前年份（避免每年手动修改）
  fillCurrentYear() {
    if (this.yearElement) {
      const currentYear = new Date().getFullYear();
      this.yearElement.textContent = currentYear;
    }
  }

  // 3. 从 GitHub API 获取最后更新时间（复用之前的逻辑）
  async fetchGithubLastUpdate() {
    if (!this.lastUpdateElement) return;
    const apiUrl = `https://api.github.com/repos/${this.githubConfig.owner}/${this.githubConfig.repo}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API 请求失败: ${response.status}`);

      const repoData = await response.json();
      const lastPushTime = new Date(repoData.pushed_at);

      // 格式化时间为 "2024-05-20" 格式（可自定义）
      const formattedTime = lastPushTime.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).replace(/\//g, "-"); // 把 "2024/05/20" 转为 "2024-05-20"

      this.lastUpdateElement.textContent = formattedTime;
    } catch (error) {
      this.lastUpdateElement.textContent = "2025-08-22"; // 失败时显示默认时间
      console.warn("Footer 组件：获取 GitHub 更新时间失败：", error);
    }
  }
}

// DOM 加载完成后初始化组件
document.addEventListener("DOMContentLoaded", () => {
  const footer = new FooterComponent();
  console.log(2222);
  setTimeout(() => {
    footer.init();
  }, 5000);
});