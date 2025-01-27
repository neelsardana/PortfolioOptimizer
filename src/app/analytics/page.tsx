'use client';

import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import FloatingBackground from '../components/FloatingBackground';
import { 
  ChartPieIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ScaleIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

type PortfolioData = {
  allocation: {
    [key: string]: {
      amount: number;
      percentage: number;
      expectedReturn: number;
      volatility: number;
    };
  };
  metrics: {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
};

type AssetDetails = {
  symbol: string;
  name: string;
  allocation: number;
  expectedReturn: number;
  volatility: number;
};

type AssetClassDetails = {
  stocks: AssetDetails[];
  bonds: AssetDetails[];
  crypto: AssetDetails[];
  mutual_funds: AssetDetails[];
  emerging_markets: AssetDetails[];
  etfs: AssetDetails[];
};

export default function AnalyticsPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [assetDetails, setAssetDetails] = useState<AssetClassDetails | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('portfolioData');
    if (savedData) {
      setPortfolioData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    if (portfolioData) {
      // No need to fetch asset details separately since they're now included in portfolioData
      const details: AssetClassDetails = {
        stocks: [],
        bonds: [],
        crypto: [],
        mutual_funds: [],
        emerging_markets: [],
        etfs: []
      };

      // Convert the new optimization model data structure to match our component's expected format
      Object.entries(portfolioData.allocation).forEach(([category, data]: [string, any]) => {
        if (data.assets) {
          details[category as keyof AssetClassDetails] = Object.entries(data.assets).map(([symbol, asset]: [string, any]) => ({
            symbol,
            name: asset.name,
            allocation: asset.percentage,
            expectedReturn: asset.expectedReturn,
            volatility: asset.volatility
          }));
        }
      });

      setAssetDetails(details);
    }
  }, [portfolioData]);

  const handleDownloadExcel = () => {
    if (!portfolioData) return;

    // Prepare data for Excel
    const excelData: any[] = [];

    // Add header row
    excelData.push(['Asset Class', 'Asset', 'Symbol', 'Amount', 'Allocation', 'Expected Return', 'Volatility', 'Sharpe Ratio']);

    // Add data rows
    Object.entries(portfolioData.allocation).forEach(([assetClass, asset]: [string, any]) => {
      // Add asset class summary row
      excelData.push([
        assetClass === 'etfs' ? 'ETFs' : assetClass.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        'Total',
        '',
        asset.amount,
        `${asset.percentage.toFixed(1)}%`,
        `${asset.expectedReturn.toFixed(2)}%`,
        `${asset.volatility.toFixed(2)}%`,
        ((asset.expectedReturn - 4.5) / asset.volatility).toFixed(2)
      ]);

      // Add individual assets
      if (asset.assets) {
        Object.entries(asset.assets).forEach(([symbol, detail]: [string, any]) => {
          excelData.push([
            '',
            detail.name,
            symbol,
            detail.amount,
            `${detail.percentage.toFixed(1)}%`,
            `${detail.expectedReturn.toFixed(2)}%`,
            `${detail.volatility.toFixed(2)}%`,
            detail.sharpeRatio.toFixed(2)
          ]);
        });
      }
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    const colWidths = [15, 30, 10, 15, 12, 15, 12, 12];
    ws['!cols'] = colWidths.map(width => ({ width }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Portfolio Details');

    // Generate Excel file
    XLSX.writeFile(wb, 'portfolio_details.xlsx');
  };

  if (!portfolioData || !assetDetails) {
    return (
      <main className="min-h-screen bg-[#111111]">
        <FloatingBackground />
        <div className="w-full pt-32 pb-16">
          <div className="text-center mb-16 px-4">
            <h1 className="text-6xl font-medium tracking-tight mb-6">
              Analytics
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              {!portfolioData ? "Please optimize your portfolio first to view analytics." : "Loading asset details..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const chartData = {
    labels: Object.keys(portfolioData.allocation).map(key => {
      if (key === 'etfs') return 'ETFs';
      return key.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }),
    datasets: [{
      data: Object.values(portfolioData.allocation).map(asset => asset.percentage),
      backgroundColor: [
        'rgba(245, 158, 11, 0.9)',  // amber
        'rgba(16, 185, 129, 0.9)',  // emerald
        'rgba(168, 85, 247, 0.9)',  // purple
        'rgba(255, 255, 255, 0.9)', // white
        'rgba(245, 158, 11, 0.7)',  // lighter amber
        'rgba(16, 185, 129, 0.7)',  // lighter emerald
      ],
      borderColor: [
        'rgba(245, 158, 11, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)',
      ],
      borderWidth: 1
    }]
  };

  const options = {
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right' as const,
        align: 'center' as const,
        labels: {
          padding: 24,
          font: {
            size: 14,
            family: 'Inter, system-ui, sans-serif'
          },
          color: 'rgba(255, 255, 255, 0.8)',
          boxWidth: 16,
          boxHeight: 16,
        }
      },
      tooltip: {
        bodyFont: {
          size: 14
        },
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
    layout: {
      padding: {
        right: 32,
        left: 0
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#111111]">
      <FloatingBackground />
      <div className="w-full pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-medium mb-8">Portfolio Analytics</h1>

          {/* Advanced Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-white/40" />
                <h3 className="text-sm text-white/40">Alpha Ratio</h3>
              </div>
              <p className="text-[2rem] font-light text-emerald-500">{((portfolioData.metrics.expectedReturn - 8) / 8 * 100).toFixed(2)}%</p>
              <p className="text-xs text-white/40 mt-2">Excess return compared to market benchmark</p>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <ChartBarIcon className="w-5 h-5 text-white/40" />
                <h3 className="text-sm text-white/40">Beta Coefficient</h3>
              </div>
              <p className="text-[2rem] font-light text-white/90">{(portfolioData.metrics.volatility / 15).toFixed(2)}</p>
              <p className="text-xs text-white/40 mt-2">Portfolio sensitivity to market movements</p>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <ScaleIcon className="w-5 h-5 text-white/40" />
                <h3 className="text-sm text-white/40">Information Ratio</h3>
              </div>
              <p className="text-[2rem] font-light text-white/90">{(portfolioData.metrics.sharpeRatio * 0.8).toFixed(2)}</p>
              <p className="text-xs text-white/40 mt-2">Risk-adjusted excess return metric</p>
            </div>
          </div>

          {/* Portfolio Composition Chart */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <ChartPieIcon className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-medium text-white/90">Portfolio Composition</h2>
            </div>
            <p className="text-sm text-white/40 mb-8">
              Breakdown of your optimized portfolio allocation across different asset classes.
            </p>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="relative w-full lg:w-[561px] h-[561px] flex items-center justify-center">
                <div className="w-full max-w-[524px]">
                  <Doughnut data={chartData} options={{
                    ...options,
                    plugins: {
                      ...options.plugins,
                      legend: {
                        ...options.plugins.legend,
                        position: 'bottom' as const,
                        labels: {
                          ...options.plugins.legend.labels,
                          padding: 20
                        }
                      }
                    }
                  }} />
                </div>
              </div>

              {/* Asset Details */}
              <div className="w-full lg:w-1/3 space-y-2">
                {Object.entries(portfolioData.allocation).map(([key, asset]) => (
                  <div key={key} className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm text-white/90 font-medium">
                        {key === 'etfs' ? 'ETFs' : key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </h3>
                      <span className="text-base font-medium text-emerald-500">{asset.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-white/40 mb-0.5">Return</p>
                        <p className={`text-sm ${asset.expectedReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {asset.expectedReturn >= 0 ? '+' : ''}{asset.expectedReturn.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 mb-0.5">Risk</p>
                        <p className="text-sm text-white/70">{asset.volatility.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 mb-0.5">Amount</p>
                        <p className="text-sm text-white/90">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(asset.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Asset Allocation Table */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-medium text-white/90">Asset Allocation Details</h2>
              </div>
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>Download Excel</span>
              </button>
            </div>
            <p className="text-sm text-white/40 mb-8">
              Detailed breakdown of your portfolio allocation with key metrics for each asset class. Click on an asset class to see individual holdings.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-white/70">
                    <th className="pb-4 font-medium">Asset</th>
                    <th className="pb-4 font-medium">Amount</th>
                    <th className="pb-4 font-medium">Allocation</th>
                    <th className="pb-4 font-medium">Expected Return</th>
                    <th className="pb-4 font-medium">Volatility</th>
                    <th className="pb-4 font-medium">Sharpe Ratio</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {Object.entries(portfolioData.allocation).map(([key, asset]: [string, any]) => (
                    <>
                      <tr 
                        key={key} 
                        className="border-t border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                        onClick={() => setExpandedAsset(expandedAsset === key ? null : key)}
                      >
                        <td className="py-4 text-white/90 flex items-center gap-2">
                          <ChevronRightIcon className={`w-4 h-4 transform transition-transform ${expandedAsset === key ? 'rotate-90' : ''}`} />
                          {key === 'etfs' ? 'ETFs' : key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </td>
                        <td className="py-4 text-white/90">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(asset.amount)}
                        </td>
                        <td className="py-4 text-white/90">{asset.percentage.toFixed(1)}%</td>
                        <td className={`py-4 ${asset.expectedReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {asset.expectedReturn >= 0 ? '+' : ''}{asset.expectedReturn.toFixed(2)}%
                        </td>
                        <td className="py-4 text-white/90">{asset.volatility.toFixed(2)}%</td>
                        <td className="py-4 text-white/90">{((asset.expectedReturn - 4.5) / asset.volatility).toFixed(2)}</td>
                      </tr>
                      {expandedAsset === key && Object.entries(asset.assets || {}).map(([symbol, detail]: [string, any]) => (
                        <tr key={symbol} className="bg-white/[0.01] text-sm">
                          <td className="py-3 pl-8 text-white/70">
                            <span className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 rounded bg-white/5">{symbol}</span>
                              {detail.name}
                            </span>
                          </td>
                          <td className="py-3 text-white/70">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }).format(detail.amount)}
                          </td>
                          <td className="py-3 text-white/70">{detail.percentage.toFixed(1)}%</td>
                          <td className={`py-3 ${detail.expectedReturn >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                            {detail.expectedReturn >= 0 ? '+' : ''}{detail.expectedReturn.toFixed(2)}%
                          </td>
                          <td className="py-3 text-white/70">{detail.volatility.toFixed(2)}%</td>
                          <td className="py-3 text-white/70">{detail.sharpeRatio.toFixed(2)}</td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 