import type { ChartOptions } from 'chart.js';

export const getChartOptions = (isPositive: boolean): ChartOptions<'line'> => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'hsl(var(--card))',
      borderColor: 'hsl(var(--border))',
      borderWidth: 1,
      titleColor: 'hsl(var(--foreground))',
      bodyColor: 'hsl(var(--foreground))',
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context) => `Price: $${context.parsed.y?.toFixed(2) || '0.00'}`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: true,
        color: 'hsl(var(--border))',
        drawTicks: false,
      },
      ticks: {
        color: 'hsl(var(--muted-foreground))',
        font: {
          size: 11,
        },
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        display: true,
        color: 'hsl(var(--border))',
        drawTicks: false,
      },
      ticks: {
        color: 'hsl(var(--muted-foreground))',
        font: {
          size: 11,
        },
      },
      border: {
        display: false,
      },
    },
  },
  elements: {
    line: {
      borderColor: isPositive
        ? 'hsl(var(--success))'
        : 'hsl(var(--danger))',
      borderWidth: 2.5,
      tension: 0.4,
    },
    point: {
      radius: 0,
      hitRadius: 10,
    },
  },
});

