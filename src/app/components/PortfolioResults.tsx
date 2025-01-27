'use client';

import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

type AssetAllocation = {
  amount: number;
  percentage: number;
  expectedReturn: number;
  volatility: number;
};

type PortfolioAllocation = {
  [key: string]: AssetAllocation;
};

type PortfolioMetrics = {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
};

type PortfolioResultsProps = {
  allocation: PortfolioAllocation;
  metrics: PortfolioMetrics;
};

const assetColors = {
  stocks: '#FF6384',
  etfs: '#36A2EB',
  mutual_funds: '#FFCE56',
  emerging_markets: '#4BC0C0',
  crypto: '#9966FF',
  bonds: '#FF9F40',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

export default function PortfolioResults({ allocation, metrics }: PortfolioResultsProps) {
  const chartData = useMemo(() => ({
    labels: Object.keys(allocation).map(key => 
      key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    ),
    datasets: [{
      data: Object.values(allocation).map(asset => asset.percentage),
      backgroundColor: Object.keys(allocation).map(key => 
        assetColors[key as keyof typeof assetColors]
      ),
      borderWidth: 1,
    }],
  }), [allocation]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const assetKey = Object.keys(allocation)[context.dataIndex];
            const assetData = allocation[assetKey];
            return [
              `${label}: ${formatPercentage(value)}`,
              `Amount: ${formatCurrency(assetData.amount)}`,
              `Expected Return: ${formatPercentage(assetData.expectedReturn)}`,
              `Volatility: ${formatPercentage(assetData.volatility)}`,
            ];
          },
        },
      },
    },
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-medium mb-6">Optimized Portfolio</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Portfolio Chart */}
        <div className="aspect-square">
          <Doughnut data={chartData} options={chartOptions} />
        </div>

        {/* Portfolio Metrics */}
        <div className="space-y-6">
          <div className="metric-card">
            <div className="text-sm text-white/70">Expected Return</div>
            <div className="text-3xl font-light mt-2 text-green-500">
              {formatPercentage(metrics.expectedReturn)}
            </div>
          </div>

          <div className="metric-card">
            <div className="text-sm text-white/70">Portfolio Volatility</div>
            <div className="text-3xl font-light mt-2">
              {formatPercentage(metrics.volatility)}
            </div>
          </div>

          <div className="metric-card">
            <div className="text-sm text-white/70">Sharpe Ratio</div>
            <div className="text-3xl font-light mt-2">
              {metrics.sharpeRatio.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Asset Allocation</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-white/70">
                <th className="pb-3">Asset</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Allocation</th>
                <th className="pb-3">Expected Return</th>
                <th className="pb-3">Volatility</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {Object.entries(allocation).map(([key, asset]) => (
                <tr key={key} className="border-t border-white/10">
                  <td className="py-3">
                    {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </td>
                  <td>{formatCurrency(asset.amount)}</td>
                  <td>{formatPercentage(asset.percentage)}</td>
                  <td className="text-green-500">{formatPercentage(asset.expectedReturn)}</td>
                  <td>{formatPercentage(asset.volatility)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 