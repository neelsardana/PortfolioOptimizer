import React, { useState } from 'react';
import { useRouter } from 'next/router';

const InvestmentForm: React.FC = () => {
  const router = useRouter();
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [riskTolerance, setRiskTolerance] = useState(50);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getRawValue = (value: string): number => {
    // Remove commas and convert to number
    return parseFloat(value.replace(/,/g, '')) || 0;
  };

  const formatNumber = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const number = value.replace(/[^\d.]/g, '');
    // Parse the number and format with commas
    const formatted = parseFloat(number).toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
    return isNaN(parseFloat(number)) ? '' : formatted;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInvestmentAmount(formatNumber(value));
  };

  const handleAssetToggle = (asset: string) => {
    setSelectedAssets(prev => 
      prev.includes(asset)
        ? prev.filter(a => a !== asset)
        : [...prev, asset]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const rawAmount = getRawValue(investmentAmount);
      const response = await fetch('/api/optimize-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: rawAmount,
          riskTolerance: riskTolerance,
          selectedAssets: selectedAssets
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize portfolio');
      }

      const data = await response.json();
      
      // Store portfolio data with investment amount
      localStorage.setItem('portfolioData', JSON.stringify({
        ...data,
        investmentAmount: rawAmount
      }));

      // Redirect to overview page
      router.push('/overview');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to optimize portfolio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-12">
      {/* Investment Amount */}
      <div className="space-y-4">
        <label className="block text-lg font-medium">
          Investment Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
          <input
            type="text"
            value={investmentAmount}
            onChange={handleAmountChange}
            placeholder="100,000"
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
      </div>

      {/* Asset Types */}
      <div className="space-y-4">
        <label className="block text-lg font-medium">
          Asset Types
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Stocks', 'Bonds', 'Real Estate', 'Commodities'].map(asset => (
            <button
              key={asset}
              type="button"
              onClick={() => handleAssetToggle(asset)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                selectedAssets.includes(asset)
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                  : 'bg-black/20 border-white/10 text-white/70 hover:border-white/30'
              }`}
            >
              {asset}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Tolerance */}
      <div className="space-y-4">
        <label className="block text-lg font-medium">
          Risk Tolerance
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={riskTolerance}
          onChange={(e) => setRiskTolerance(parseInt(e.target.value))}
          className="w-full h-2 bg-black/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-sm text-white/60">
          <span>Conservative</span>
          <span>Moderate</span>
          <span>Aggressive</span>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isLoading || !investmentAmount || selectedAssets.length === 0}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 text-lg font-medium transition-colors"
      >
        {isLoading ? 'Optimizing...' : 'Optimize Portfolio'}
      </button>
    </form>
  );
};

export default InvestmentForm; 