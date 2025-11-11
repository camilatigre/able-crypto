import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getChartOptions } from '../lib/chart-config';
import type { ChartDataPoint } from '../types/crypto';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PriceChartProps {
  data: ChartDataPoint[];
  isPositive: boolean;
}

export const PriceChart = ({ data, isPositive }: PriceChartProps) => {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Update chart when data changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update('none'); // Update without animation for real-time feel
    }
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        No chart data yet
      </div>
    );
  }

  const chartData: ChartData<'line'> = {
    labels: data.map((d) => d.time),
    datasets: [
      {
        data: data.map((d) => d.price),
        fill: false,
      },
    ],
  };

  return (
    <Line
      ref={chartRef}
      data={chartData}
      options={getChartOptions(isPositive)}
    />
  );
};

