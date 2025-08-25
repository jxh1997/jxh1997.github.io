// 加载组件的函数
function loadComponent(elementId, componentPath) {
  fetch(componentPath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`无法加载组件: ${componentPath}`);
      }
      return response.text();
    })
    .then(html => {
      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = html;

        // 执行组件中的脚本
        const scripts = element.querySelectorAll('script');
        scripts.forEach(oldScript => {
          const newScript = document.createElement('script');
          // 复制所有属性
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          // 复制内容
          newScript.textContent = oldScript.textContent;
          // 替换旧脚本
          oldScript.parentNode.replaceChild(newScript, oldScript);
        });
      }
    })
    .catch(error => console.error('加载组件时出错:', error));
}

// 页面加载完成后加载所有组件
document.addEventListener('DOMContentLoaded', function () {
  // 加载导航栏组件
  loadComponent('navbar-placeholder', 'components/navbar.html');
  // footer组件
  loadComponent('footer-placeholder', 'components/footer.html');
});