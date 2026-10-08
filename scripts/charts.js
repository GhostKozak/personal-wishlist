import { AppState } from './state.js';
import { formatCurrency, getPriorityInfo, toTRY } from './utils.js';

export const renderPriorityChart = () => {
  const chartSection = document.querySelector('.chart-section');
  const ctx = document.getElementById('priority-chart');
  if (!ctx || !chartSection) return;

  const dataValues = getPriorityBudgetDistribution();

  const hasData = dataValues.some(value => value > 0);

  if (!hasData) {
    chartSection.style.display = 'none';
    if (AppState.priorityChart) {
      AppState.priorityChart.destroy();
      AppState.priorityChart = null;
    }
    return;
  }

  chartSection.style.display = 'block';

  if (AppState.priorityChart) {
    AppState.priorityChart.destroy();
  }

  // 2. Yeni Pie Chart oluştur
  AppState.priorityChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['P1: Urgent & Important', 'P2: Important', 'P3: Urgent', 'P4: Someday'],
      datasets: [{
        data: dataValues,
        backgroundColor: ['#ff6384', '#36a2eb', '#ffcd67', '#64748b'],
        borderWidth: 0,
        borderColor: 'transparent',
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 25,
            font: { size: 16 },
            generateLabels: (chart) => {
              const { labels, datasets } = chart.data;
              if (!labels?.length || !datasets?.length) return [];

              const dataset = datasets[0];

              return labels.map((label, index) => {
                const value = dataset.data[index] || 0;
                const isHidden = !chart.getDataVisibility(index);

                return {
                  text: `${label}: ${formatCurrency(value)} TL`,
                  fillStyle: dataset.backgroundColor[index],
                  fontColor: '#cbd5e1',
                  hidden: isHidden,
                  index
                };
              });
            }
          },
          onHover: handleHover,
          onLeave: handleLeave
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (context) => ` ${context.label}: ${formatCurrency(context.raw)} TL`
          }
        }
      }
    }
  });
};

function handleHover(evt, item, legend) {
  legend.chart.data.datasets[0].backgroundColor.forEach((color, index, colors) => {
    colors[index] = index === item.index || color.length === 9 ? color : color + '4D';
  });
  legend.chart.update();
}

function handleLeave(evt, item, legend) {
  legend.chart.data.datasets[0].backgroundColor.forEach((color, index, colors) => {
    colors[index] = color.length === 9 ? color.slice(0, -2) : color;
  });
  legend.chart.update();
}


const getPriorityBudgetDistribution = () => {
  let priTotal = {p1: 0, p2: 0, p3: 0, p4: 0};
  AppState.wishlist
    .filter(item => item.status !== "canceled")
    .forEach(item => {
      const key = `p${getPriorityInfo(item.importance, item.urgency).score}`;
      priTotal[key] += toTRY(item.price, item.currency);
    });
  return Object.values(priTotal);
}