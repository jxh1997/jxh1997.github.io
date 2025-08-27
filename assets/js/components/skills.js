/**
 * 技能栈组件逻辑
 */
document.addEventListener('DOMContentLoaded', function () {
  // 初始化技能雷达图
  const initSkillsChart = function () {
    const ctx = document.getElementById('skillsRadarChart');

    // 检查Chart是否已存在，如果存在则销毁
    if (window.skillsChartInstance) {
      window.skillsChartInstance.destroy();
    }

    // 创建新图表
    window.skillsChartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: [
          '前端开发',
          '后端开发',
          '移动端开发',
          '数据库',
          '系统设计',
          '产品设计',
          '项目管理'
        ],
        datasets: [{
            label: '主业技能',
            data: [90, 60, 50, 70, 80, 40, 75],
            backgroundColor: 'rgba(22, 93, 255, 0.2)',
            borderColor: 'rgba(22, 93, 255, 1)',
            pointBackgroundColor: 'rgba(22, 93, 255, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(22, 93, 255, 1)'
          },
          {
            label: '副业技能',
            data: [75, 70, 80, 65, 60, 75, 50],
            backgroundColor: 'rgba(255, 125, 0, 0.2)',
            borderColor: 'rgba(255, 125, 0, 1)',
            pointBackgroundColor: 'rgba(255, 125, 0, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(255, 125, 0, 1)'
          }
        ]
      },
      options: {
        scales: {
          r: {
            angleLines: {
              display: true
            },
            suggestedMin: 0,
            suggestedMax: 100
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  };

  // 初始化图表
  initSkillsChart();

  // 窗口大小改变时重新初始化图表
  window.addEventListener('resize', utils.debounce(initSkillsChart, 300));
});