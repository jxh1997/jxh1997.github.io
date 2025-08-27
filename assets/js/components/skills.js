document.addEventListener('DOMContentLoaded', function () {
  const ctx = document.getElementById('skillsRadarChart').getContext('2d');
  const skillsRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: [
        'HTML5/CSS3',
        'JavaScript',
        'Vue/React',
        'TypeScript',
        '跨端开发',
        '工程化',
        '服务端(NodeJS)',
        '数据库',
        '性能优化'
      ],
      datasets: [{
        label: '技能熟练度',
        data: [95, 90, 92, 85, 75, 88, 80, 72, 85],
        backgroundColor: 'rgba(22, 93, 255, 0.2)',
        borderColor: 'rgba(22, 93, 255, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(22, 93, 255, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(22, 93, 255, 1)'
      }]
    },
    options: {
      scales: {
        r: {
          angleLines: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          pointLabels: {
            font: {
              size: 12,
              family: 'Inter, sans-serif'
            },
            color: '#1D2939'
          },
          ticks: {
            backdropColor: 'transparent',
            color: '#666',
            stepSize: 20,
            max: 100,
            min: 0
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1D2939',
          titleFont: {
            size: 14,
            family: 'Inter, sans-serif'
          },
          bodyFont: {
            size: 12,
            family: 'Inter, sans-serif'
          },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              const value = context.raw;
              let level = '';
              if (value >= 90) level = '精通';
              else if (value >= 80) level = '熟练';
              else if (value >= 70) level = '掌握';
              else level = '了解';
              return `${context.label}: ${level} (${value}分)`;
            }
          }
        }
      },
      elements: {
        line: {
          tension: 0.2
        }
      },
      maintainAspectRatio: false
    }
  });
});