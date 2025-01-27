'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  Scale,
  CoreScaleOptions,
  Tick
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import FloatingBackground from '../components/FloatingBackground';
import Link from 'next/link';
import { 
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
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
  investmentAmount?: number;
};

export default function OverviewPage() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [marketData, setMarketData] = useState<{
    sp500: { date: string; value: number; }[];
    nasdaq: { date: string; value: number; }[];
  } | null>(null);

  useEffect(() => {
    const savedData = localStorage.getItem('portfolioData');
    if (savedData) {
      setPortfolioData(JSON.parse(savedData));
    }

    // Fetch market data
    fetch('/api/market-data')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setMarketData(data);
        }
      })
      .catch(error => console.error('Error fetching market data:', error));
  }, []);

  if (!portfolioData) {
    return (
      <main className="min-h-screen bg-[#111111]">
        <FloatingBackground />
        <div className="w-full pt-32 pb-16">
          <div className="text-center mb-16 px-4">
            <h1 className="text-6xl font-medium tracking-tight mb-6">
              Portfolio Overview
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Please optimize your portfolio first to view the overview.
              <br />
              <Link 
                href="/optimize" 
                className="text-emerald-500 hover:text-emerald-400 transition-colors mt-4 inline-block"
              >
                Go to Portfolio Optimization →
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const investmentAmount = portfolioData.investmentAmount || 100000;
  const projectedValue = Math.round(investmentAmount * (1 + portfolioData.metrics.expectedReturn / 100));

  // Prepare chart data
  const currentDate = new Date();
  const midPoint = marketData ? Math.floor(marketData.sp500.length / 2) : 0;
  
  // Find the index of the current month in the data
  const getCurrentMonthIndex = (data: { date: string }[]) => {
    if (!data || data.length === 0) return 0;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    return data.findIndex(item => item.date.startsWith(currentMonth)) || 6; // Default to December if not found
  };

  // Format date labels with proper month ranges
  const formatDateLabel = (date: string, index: number, totalPoints: number) => {
    const dateObj = new Date(date);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear().toString().slice(-2);
    
    const currentMonthIndex = getCurrentMonthIndex(marketData?.sp500 || []);
    // Show full label (month + year) for first, middle, and last points
    const label = `${month} '${year}`;
    if (index > currentMonthIndex) {
      return `${label} (Forecast)`;
    }
    return label;
  };

  const data = {
    labels: marketData ? marketData.sp500.map((item, index) => 
      formatDateLabel(item.date, index, marketData.sp500.length)
    ) : [],
    datasets: [
      {
        label: 'S&P 500',
        data: marketData?.sp500.map(item => item.value) || [],
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B',
        borderWidth: 2,
        pointRadius: 0,
        segment: {
          borderDash: (ctx: any) => {
            const index = ctx.p0DataIndex;
            const currentMonthIndex = getCurrentMonthIndex(marketData?.sp500 || []);
            return index >= currentMonthIndex ? [5, 5] : undefined;
          }
        }
      },
      {
        label: 'Optimized Portfolio',
        data: marketData?.sp500.map((item, index) => {
          const baseValue = item.value;
          const monthlyOutperformance = (portfolioData.metrics.expectedReturn - 8) / 12;
          const monthsFromStart = index;
          return baseValue * (1 + (monthlyOutperformance * monthsFromStart) / 100);
        }) || [],
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        borderWidth: 2,
        pointRadius: 0,
        segment: {
          borderDash: (ctx: any) => {
            const index = ctx.p0DataIndex;
            const currentMonthIndex = getCurrentMonthIndex(marketData?.sp500 || []);
            return index >= currentMonthIndex ? [5, 5] : undefined;
          }
        }
      },
      {
        label: 'NASDAQ',
        data: marketData?.nasdaq.map(item => item.value) || [],
        borderColor: '#8B5CF6',
        backgroundColor: '#8B5CF6',
        borderWidth: 2,
        pointRadius: 0,
        segment: {
          borderDash: (ctx: any) => {
            const index = ctx.p0DataIndex;
            const currentMonthIndex = getCurrentMonthIndex(marketData?.sp500 || []);
            return index >= currentMonthIndex ? [5, 5] : undefined;
          }
        }
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          padding: 20,
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 14,
            family: 'system-ui'
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        padding: 12
      },
      annotation: {
        annotations: {
          forecastLine: {
            type: 'line',
            xMin: getCurrentMonthIndex(marketData?.sp500 || []),
            xMax: getCurrentMonthIndex(marketData?.sp500 || []),
            yMin: 0,
            yMax: 100,
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderWidth: 1,
            borderDash: [5, 5],
            label: {
              display: true,
              content: 'Current',
              position: 'start',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'rgba(255, 255, 255, 0.8)',
              font: {
                size: 12
              },
              padding: 4,
              yAdjust: -10
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 12
          },
          maxRotation: 0,
          autoSkip: false,
          maxTicksLimit: 13, // Show all months
          callback: function(this: any, value: any, index: number) {
            const labels = this.chart?.data?.labels;
            if (!labels || typeof index !== 'number') return '';
            
            // Show full label at start, middle, and end
            if (index === 0 || index === midPoint || index === labels.length - 1) {
              return labels[index];
            }
            // Show only month for other points
            const label = labels[index];
            return typeof label === 'string' ? label.split(' ')[0] : label;
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          font: {
            size: 12
          },
          callback: function(value: any) {
            return value + '%';
          }
        },
        suggestedMin: marketData ? Math.min(
          ...marketData.sp500.map(d => d.value),
          ...marketData.nasdaq.map(d => d.value)
        ) * 0.95 : undefined,
        suggestedMax: marketData ? Math.max(
          ...marketData.sp500.map(d => d.value),
          ...marketData.nasdaq.map(d => d.value)
        ) * 1.05 : undefined
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#111111]">
      <FloatingBackground />
      <div className="w-full pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-medium mb-8">Portfolio Overview</h1>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <BanknotesIcon className="w-5 h-5 text-white/40" />
                <h3 className="text-sm text-white/40">Portfolio Value</h3>
              </div>
              <p className="text-[2rem] font-light text-white/90">{formatCurrency(investmentAmount)}</p>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <ArrowTrendingUpIcon className="w-5 h-5 text-white/40" />
                <h3 className="text-sm text-white/40">Performance</h3>
              </div>
              <p className="text-[2rem] font-light text-emerald-500">+{portfolioData.metrics.expectedReturn.toFixed(1)}%</p>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <ChartBarIcon className="w-5 h-5 text-white/40" />
                <h3 className="text-sm text-white/40">Risk Score</h3>
              </div>
              <p className="text-[2rem] font-light text-white/90">{portfolioData.metrics.volatility.toFixed(1)}%</p>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <ClockIcon className="w-5 h-5 text-white/40" />
                <h3 className="text-sm text-white/40">Projected Value</h3>
              </div>
              <p className="text-[2rem] font-light text-white/90">{formatCurrency(projectedValue)}</p>
            </div>
          </div>

          {/* Market Performance Chart */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <PresentationChartLineIcon className="w-6 h-6 text-emerald-500" />
              <h2 className="text-xl font-medium text-white/90">Market Performance Comparison</h2>
            </div>
            <p className="text-sm text-white/40 mb-8">
              Compare your optimized portfolio's performance against major market indices.
            </p>
            <div className="h-[400px]">
              <Line data={data} options={options} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 