'use client';

import { useState, useMemo } from 'react';
import { Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import FloatingBackground from '../components/FloatingBackground';
import { 
  ChartBarIcon, 
  ShieldCheckIcon, 
  CogIcon,
  PresentationChartLineIcon,
  ChartPieIcon,
  ScaleIcon,
  ArrowTrendingUpIcon,
  ChartBarSquareIcon
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement,
  RadialLinearScale
);

export default function AboutPage() {
  const [selectedRisk, setSelectedRisk] = useState(50);

  // Calculate the selected portfolio point based on risk tolerance
  const selectedPortfolioData = useMemo(() => {
    const riskPoints = [0, 5, 10, 15, 20, 25, 30];
    const returnPoints = [4, 6, 8, 11, 15, 20, 26];
    
    // Convert risk tolerance (0-100) to risk percentage (0-30)
    const targetRisk = (selectedRisk / 100) * 30;
    
    // Find the closest risk points
    let index = 0;
    for (let i = 0; i < riskPoints.length; i++) {
      if (riskPoints[i] <= targetRisk) {
        index = i;
      } else {
        break;
      }
    }
    
    // Linear interpolation between points
    const data = new Array(7).fill(null);
    if (index < riskPoints.length - 1) {
      const riskDiff = riskPoints[index + 1] - riskPoints[index];
      const returnDiff = returnPoints[index + 1] - returnPoints[index];
      const ratio = (targetRisk - riskPoints[index]) / riskDiff;
      const interpolatedReturn = returnPoints[index] + (returnDiff * ratio);
      data[index] = interpolatedReturn;
    } else {
      data[index] = returnPoints[index];
    }
    
    return data;
  }, [selectedRisk]);

  // Efficient Frontier Data
  const efficientFrontierData = {
    labels: ['0%', '5%', '10%', '15%', '20%', '25%', '30%'],
    datasets: [
      {
        label: 'Efficient Frontier',
        data: [4, 6, 8, 11, 15, 20, 26],
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#10B981'
      },
      {
        label: 'Selected Portfolio',
        data: selectedPortfolioData,
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B',
        pointRadius: 8,
        pointBackgroundColor: '#F59E0B'
      }
    ]
  };

  // Portfolio Composition Data
  const portfolioCompositionData = {
    labels: ['Stocks', 'Bonds', 'Real Estate', 'Commodities'],
    datasets: [{
      data: [40, 30, 20, 10],
      backgroundColor: [
        'rgba(16, 185, 129, 0.9)',  // Emerald (matching efficient frontier)
        'rgba(245, 158, 11, 0.9)',  // Amber (matching selected portfolio)
        'rgba(255, 255, 255, 0.9)',  // White for Real Estate
        'rgba(168, 85, 247, 0.9)'   // Purple (matching checkmark icon)
      ],
      borderWidth: 1,
      borderColor: [
        'rgba(16, 185, 129, 1)',    // Solid emerald
        'rgba(245, 158, 11, 1)',    // Solid amber
        'rgba(255, 255, 255, 1)',   // Solid white border
        'rgba(168, 85, 247, 1)'     // Solid purple border
      ]
    }]
  };

  const portfolioCompositionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',  // Make the doughnut thinner and more elegant
    plugins: {
      legend: {
        position: 'right' as const,
        align: 'center' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
          padding: 24,
          font: {
            size: 14,
            weight: 500,
            family: 'Inter, system-ui, sans-serif'
          },
          boxWidth: 16,  // Make legend color boxes smaller
          boxHeight: 16  // Make legend color boxes smaller
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        cornerRadius: 8,
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
        top: 8,
        bottom: 8,
        left: 8,
        right: 32  // Add more padding on the right for the legend
      }
    }
  };

  // Risk Metrics Visualization Data
  const riskMetricsData = {
    labels: ['Market Risk', 'Credit Risk', 'Liquidity Risk', 'Operational Risk'],
    datasets: [{
      data: [85, 65, 75, 90],
      backgroundColor: '#10B981',
      borderColor: '#10B981',
      borderWidth: 2,
      fill: true
    }]
  };

  const riskMetricsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          display: false
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const efficientFrontierOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.9)',
          padding: 20,
          font: {
            size: 13,
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Expected Return (%)',
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
            weight: 500
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.08)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Portfolio Risk (Volatility)',
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
            weight: 500
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.08)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          }
        }
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#111111]">
      <FloatingBackground />
      <div className="w-full pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-medium mb-8">About Portfolio Optimization</h1>

          {/* Introduction Section */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <ChartBarIcon className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-medium text-white/90">How It Works</h2>
            </div>
            <p className="text-sm text-white/70 mb-8">
              Our portfolio optimization tool uses Modern Portfolio Theory (MPT) to create efficient portfolios that maximize expected returns for a given level of risk. By analyzing historical data and market trends, we help you find the optimal balance between risk and reward.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/[0.01] rounded-lg p-6 border border-white/5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <ChartBarSquareIcon className="w-8 h-8 text-amber-500" />
                  <h3 className="text-sm font-medium text-white/90">Data Analysis</h3>
                </div>
                <p className="text-sm text-white/60">We analyze historical market data and asset performance to calculate expected returns and risk metrics.</p>
              </div>
              <div className="bg-white/[0.01] rounded-lg p-6 border border-white/5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheckIcon className="w-8 h-8 text-emerald-500" />
                  <h3 className="text-sm font-medium text-white/90">Risk Assessment</h3>
                </div>
                <p className="text-sm text-white/60">Your risk tolerance is matched with optimal asset allocations to create a personalized portfolio.</p>
              </div>
              <div className="bg-white/[0.01] rounded-lg p-6 border border-white/5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <CogIcon className="w-8 h-8 text-purple-500" />
                  <h3 className="text-sm font-medium text-white/90">Optimization</h3>
                </div>
                <p className="text-sm text-white/60">Advanced algorithms determine the most efficient portfolio allocation based on your preferences.</p>
              </div>
            </div>
          </div>

          {/* Efficient Frontier Section */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-medium text-white/90">Efficient Frontier</h2>
            </div>
            <p className="text-sm text-white/40 mb-8">
              The efficient frontier represents the optimal portfolios that offer the highest expected return for a defined level of risk. Adjust the slider to see how different risk levels affect your potential returns.
            </p>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-white/70">Risk Tolerance</label>
                <span className="text-sm font-medium text-emerald-500">{selectedRisk}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedRisk}
                onChange={(e) => setSelectedRisk(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>
            <div className="h-[400px]">
              <Line data={efficientFrontierData} options={efficientFrontierOptions} />
            </div>
          </div>

          {/* Portfolio Composition Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <ChartPieIcon className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-medium text-white/90">Sample Portfolio Composition</h2>
              </div>
              <p className="text-sm text-white/40 mb-8">
                Example of how assets might be distributed in an optimized portfolio based on your risk tolerance.
              </p>
              <div className="h-[400px]">
                <Doughnut data={portfolioCompositionData} options={portfolioCompositionOptions} />
              </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <ScaleIcon className="w-6 h-6 text-emerald-500" />
                <h2 className="text-xl font-medium text-white/90">Risk Analysis</h2>
              </div>
              <p className="text-sm text-white/40 mb-8">
                Visualization of various risk factors that are considered in the portfolio optimization process.
              </p>
              <div className="h-[400px]">
                <Radar data={riskMetricsData} options={riskMetricsOptions} />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <ChartBarIcon className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-medium text-white/90">Key Benefits</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/[0.01] rounded-lg p-6 border border-white/5 hover:bg-white/[0.02] transition-colors">
                <ChartBarSquareIcon className="w-8 h-8 text-amber-500 mb-4" />
                <h3 className="text-sm font-medium text-white/90 mb-2">Data-Driven Decisions</h3>
                <p className="text-sm text-white/60">Make investment decisions based on quantitative analysis and historical data.</p>
              </div>
              <div className="bg-white/[0.01] rounded-lg p-6 border border-white/5 hover:bg-white/[0.02] transition-colors">
                <ShieldCheckIcon className="w-8 h-8 text-emerald-500 mb-4" />
                <h3 className="text-sm font-medium text-white/90 mb-2">Risk Management</h3>
                <p className="text-sm text-white/60">Optimize your portfolio's risk-return tradeoff based on your preferences.</p>
              </div>
              <div className="bg-white/[0.01] rounded-lg p-6 border border-white/5 hover:bg-white/[0.02] transition-colors">
                <ChartPieIcon className="w-8 h-8 text-purple-500 mb-4" />
                <h3 className="text-sm font-medium text-white/90 mb-2">Diversification</h3>
                <p className="text-sm text-white/60">Spread investments across various assets to reduce portfolio risk.</p>
              </div>
              <div className="bg-white/[0.01] rounded-lg p-6 border border-white/5 hover:bg-white/[0.02] transition-colors">
                <ArrowTrendingUpIcon className="w-8 h-8 text-amber-500 mb-4" />
                <h3 className="text-sm font-medium text-white/90 mb-2">Performance Tracking</h3>
                <p className="text-sm text-white/60">Monitor your portfolio's performance against market benchmarks.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 