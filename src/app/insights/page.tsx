'use client';

import { useState, useEffect, useRef } from 'react';
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
  Filler,
  ChartOptions,
  ChartData,
  TooltipItem,
  LegendItem
} from 'chart.js';
import FloatingBackground from '../components/FloatingBackground';
import { 
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type AssetData = {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  marketCap: number;
  volume: number;
  dates: string[];
  prices: number[];
  forecast: number[];
  upperCI90: number[];
  upperCI80: number[];
  upperCI50: number[];
  lowerCI50: number[];
  lowerCI80: number[];
  lowerCI90: number[];
  recommendation: 'Buy' | 'Sell' | 'Hold';
  confidence: number;
  reasoning: string;
};

type TopPick = {
  symbol: string;
  name: string;
  action: 'Buy' | 'Sell';
  reasoning: string;
  priceChange: number;
  confidence: number;
};

export default function InsightsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topPicks, setTopPicks] = useState<TopPick[]>([]);

  // Common assets for quick access
  const commonAssets = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'GOOGL', name: 'Google' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'BTC-USD', name: 'Bitcoin' },
    { symbol: 'ETH-USD', name: 'Ethereum' },
    { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'QQQ', name: 'NASDAQ ETF' },
    { symbol: 'VTI', name: 'Total Market ETF' }
  ];

  // Available assets for autocomplete
  const availableAssets = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'BTC-USD', name: 'Bitcoin USD' },
    { symbol: 'ETH-USD', name: 'Ethereum USD' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
  ];

  useEffect(() => {
    const fetchTopPicks = async () => {
      try {
        // List of major assets to analyze
        const assets = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'META', 'AMZN', 'TSLA', 'BTC-USD', 'ETH-USD'];
        const picks: TopPick[] = [];

        for (const symbol of assets) {
          const response = await fetch(`/api/asset-data?symbol=${symbol}`);
          if (response.ok) {
            const data = await response.json();
            if (data.confidence > 65) { // Only include high confidence picks
              picks.push({
                symbol: data.symbol,
                name: data.name,
                action: data.recommendation,
                reasoning: data.reasoning,
                priceChange: data.priceChangePercent,
                confidence: data.confidence
              });
            }
          }
        }

        // Sort by confidence and take top 4
        setTopPicks(picks.sort((a, b) => b.confidence - a.confidence).slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch top picks:', error);
      }
    };

    fetchTopPicks();
    // Refresh every 24 hours
    const interval = setInterval(fetchTopPicks, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      const filtered = availableAssets.filter(
        asset => 
          asset.symbol.toLowerCase().includes(value.toLowerCase()) ||
          asset.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.map(asset => `${asset.symbol} - ${asset.name}`));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    const symbol = suggestion.split(' - ')[0];
    setSearchQuery(symbol);
    setShowSuggestions(false);
    handleViewAnalysis(symbol);
  };

  // Close suggestions when clicking outside
  const searchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asset-data?symbol=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch asset data');
      }

      setAssetData({
        symbol: data.symbol,
        name: data.name,
        currentPrice: data.currentPrice,
        priceChange: data.priceChange,
        priceChangePercent: data.priceChangePercent,
        marketCap: data.marketCap,
        volume: data.volume,
        dates: data.dates,
        prices: data.prices,
        forecast: data.forecast,
        upperCI90: data.upperCI90,
        upperCI80: data.upperCI80,
        upperCI50: data.upperCI50,
        lowerCI50: data.lowerCI50,
        lowerCI80: data.lowerCI80,
        lowerCI90: data.lowerCI90,
        recommendation: data.recommendation,
        confidence: data.confidence,
        reasoning: data.reasoning
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAnalysis = async (symbol: string) => {
    setSearchQuery(symbol);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asset-data?symbol=${encodeURIComponent(symbol)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch asset data');
      }

      setAssetData({
        symbol: data.symbol,
        name: data.name,
        currentPrice: data.currentPrice,
        priceChange: data.priceChange,
        priceChangePercent: data.priceChangePercent,
        marketCap: data.marketCap,
        volume: data.volume,
        dates: data.dates,
        prices: data.prices,
        forecast: data.forecast,
        upperCI90: data.upperCI90,
        upperCI80: data.upperCI80,
        upperCI50: data.upperCI50,
        lowerCI50: data.lowerCI50,
        lowerCI80: data.lowerCI80,
        lowerCI90: data.lowerCI90,
        recommendation: data.recommendation,
        confidence: data.confidence,
        reasoning: data.reasoning
      });

      // Scroll to the chart section
      const chartSection = document.querySelector('.chart-section');
      if (chartSection) {
        chartSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: 'Buy' | 'Sell' | 'Hold') => {
    switch (recommendation) {
      case 'Buy': return 'text-emerald-500';
      case 'Sell': return 'text-red-500';
      case 'Hold': return 'text-amber-500';
    }
  };

  const getRecommendationIcon = (recommendation: 'Buy' | 'Sell' | 'Hold') => {
    switch (recommendation) {
      case 'Buy': return <ArrowTrendingUpIcon className="w-8 h-8" />;
      case 'Sell': return <ArrowTrendingDownIcon className="w-8 h-8" />;
      case 'Hold': return <MinusIcon className="w-8 h-8" />;
    }
  };

  const chartData = assetData ? {
    labels: [...assetData.dates, ...assetData.dates.slice(-1)[0] ? [assetData.dates.slice(-1)[0]] : [], ...Array(90).fill('').map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    })],
    datasets: [
      {
        label: 'Historical Price',
        data: assetData.prices,
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: 'Forecasted Price',
        data: [...Array(assetData.prices.length).fill(null), assetData.prices[assetData.prices.length - 1], ...assetData.forecast],
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        borderWidth: 2,
        pointRadius: 0,
        borderDash: [5, 5],
        tension: 0.4
      },
      {
        label: '90% Confidence',
        data: [...Array(assetData.prices.length).fill(null), null, ...assetData.upperCI90],
        borderColor: 'rgba(16, 185, 129, 0.1)',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 0,
        fill: '+1',
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: '80% Confidence',
        data: [...Array(assetData.prices.length).fill(null), null, ...assetData.upperCI80],
        borderColor: 'rgba(16, 185, 129, 0.2)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 0,
        fill: '+1',
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: '50% Confidence',
        data: [...Array(assetData.prices.length).fill(null), null, ...assetData.upperCI50],
        borderColor: 'rgba(16, 185, 129, 0.3)',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 0,
        fill: '+1',
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: 'Lower 50%',
        data: [...Array(assetData.prices.length).fill(null), null, ...assetData.lowerCI50],
        borderColor: 'rgba(16, 185, 129, 0.3)',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 0,
        fill: '+1',
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: 'Lower 80%',
        data: [...Array(assetData.prices.length).fill(null), null, ...assetData.lowerCI80],
        borderColor: 'rgba(16, 185, 129, 0.2)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 0,
        fill: '+1',
        pointRadius: 0,
        tension: 0.4
      },
      {
        label: 'Lower 90%',
        data: [...Array(assetData.prices.length).fill(null), null, ...assetData.lowerCI90],
        borderColor: 'rgba(16, 185, 129, 0.1)',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 0,
        fill: '+1',
        pointRadius: 0,
        tension: 0.4
      }
    ]
  } : null;

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          callback: (value: number) => 
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value)
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          filter: (item: LegendItem) => !item.text.includes('Lower'),
          usePointStyle: true
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const value = context.raw as number;
            if (!value) return '';
            return `${context.dataset.label}: ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(value)}`;
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
          <h1 className="text-4xl font-medium mb-8">Market Insights</h1>

          {/* Search Section */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-8 mb-8">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative" ref={searchRef}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Enter an asset name or symbol (e.g., Apple, BTC, SPY)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pl-12 text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-emerald-500/20 text-emerald-500 px-4 py-1 rounded-md text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </button>

                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-2 text-left text-white/90 hover:bg-white/5 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Access Buttons */}
              <div className="mt-4 overflow-hidden">
                <p className="px-1 text-sm text-white/40 mb-1">Quick Access:</p>
                <div className="relative w-full overflow-hidden">
                  <div className="animate-scroll inline-flex whitespace-nowrap gap-2 py-1 hover:pause">
                    {/* First set of assets */}
                    {commonAssets.map((asset) => (
                      <button
                        key={`first-${asset.symbol}`}
                        onClick={() => handleViewAnalysis(asset.symbol)}
                        type="button"
                        className="inline-flex shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-all hover:scale-105 hover:text-emerald-500 hover:border-emerald-500/20 items-center gap-1.5"
                      >
                        <span className="font-medium">{asset.symbol}</span>
                        <span className="text-xs text-white/40">{asset.name}</span>
                      </button>
                    ))}
                    {/* Duplicate set for seamless loop */}
                    {commonAssets.map((asset) => (
                      <button
                        key={`second-${asset.symbol}`}
                        onClick={() => handleViewAnalysis(asset.symbol)}
                        type="button"
                        className="inline-flex shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-all hover:scale-105 hover:text-emerald-500 hover:border-emerald-500/20 items-center gap-1.5"
                      >
                        <span className="font-medium">{asset.symbol}</span>
                        <span className="text-xs text-white/40">{asset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-500">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {assetData && (
              <div className="mt-8">
                {/* Add class name to chart section for scrolling */}
                <div className="chart-section">
                  {/* Asset Details Header */}
                  <div className="mb-8 bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-6">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg px-3 py-1 rounded bg-white/5">{assetData.symbol}</span>
                            <h2 className="text-xl font-medium text-white/90">{assetData.name}</h2>
                          </div>
                          <div className="mt-3 flex items-baseline gap-3">
                            <p className="text-3xl font-light text-white/90">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(assetData.currentPrice)}
                            </p>
                            <span className={`text-lg font-light ${assetData.priceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {assetData.priceChange >= 0 ? '+' : ''}{assetData.priceChange.toFixed(2)} ({assetData.priceChangePercent.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 lg:mt-0 grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        <div>
                          <p className="text-sm text-white/40">Market Cap</p>
                          <p className="text-base text-white/90">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              notation: 'compact',
                              maximumFractionDigits: 1
                            }).format(assetData.marketCap)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/40">24h Volume</p>
                          <p className="text-base text-white/90">
                            {new Intl.NumberFormat('en-US', {
                              notation: 'compact',
                              maximumFractionDigits: 1
                            }).format(assetData.volume)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/40">Forecast Trend</p>
                          <p className={`text-base ${assetData.recommendation === 'Buy' ? 'text-emerald-500' : assetData.recommendation === 'Sell' ? 'text-red-500' : 'text-amber-500'}`}>
                            {assetData.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="h-[400px] mb-8">
                    <Line data={chartData!} options={chartOptions} />
                  </div>

                  <div className="flex flex-col items-center">
                    <div className={`flex items-center gap-3 ${getRecommendationColor(assetData.recommendation)}`}>
                      {getRecommendationIcon(assetData.recommendation)}
                      <span className="text-4xl font-medium">{assetData.recommendation}</span>
                    </div>
                    <p className="mt-2 text-white/60 text-sm">
                      {assetData.confidence.toFixed(1)}% confidence based on our analysis
                    </p>
                    <p className="mt-1 text-white/40 text-sm">
                      {assetData.reasoning}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Picks Section */}
          <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-xl p-8">
            <h2 className="text-xl font-medium text-white/90 mb-6">Top Investment Opportunities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topPicks.map((pick) => (
                <div key={pick.symbol} className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm px-2 py-1 rounded bg-white/5">{pick.symbol}</span>
                        <h3 className="text-white/90">{pick.name}</h3>
                      </div>
                      <p className="text-sm text-white/60 mt-2">{pick.reasoning}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`flex items-center gap-1 ${pick.action === 'Buy' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {pick.action === 'Buy' ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                        <span className="font-medium">{pick.action}</span>
                      </div>
                      <span className={`text-sm ${pick.priceChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {pick.priceChange >= 0 ? '+' : ''}{pick.priceChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 text-xs text-white/40">
                    <span>Confidence: {Math.round(pick.confidence)}%</span>
                    <button
                      onClick={() => handleViewAnalysis(pick.symbol)}
                      className="flex items-center gap-1 text-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                      View Analysis
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Add this at the end of the file, before the last closing brace
const scrollKeyframes = `
@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
`;

const styles = document.createElement('style');
styles.textContent = scrollKeyframes;
if (typeof document !== 'undefined') {
  document.head.appendChild(styles);
}

// Add this to your existing Tailwind classes (can be added in tailwind.config.js)
// animation: {
//   scroll: 'scroll 30s linear infinite',
// } 