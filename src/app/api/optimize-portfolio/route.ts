import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import yahooFinance from 'yahoo-finance2';

const LOOKBACK_PERIOD = '1y'; // 1 year of historical data for calculations
const RISK_FREE_RATE = 4.5; // Current 10-year Treasury yield

type AssetCategory = 'stocks' | 'bonds' | 'crypto' | 'mutual_funds' | 'emerging_markets' | 'etfs';

const availableAssets: Record<AssetCategory, string[]> = {
  stocks: [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 
    'META', 'TSLA', 'BRK-B', 'JPM', 'V'
  ],
  bonds: ['AGG', 'BND', 'TLT', 'IEF', 'SHY'],
  crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD'],
  mutual_funds: ['VFIAX', 'VTSAX', 'VBTLX', 'VTIAX'],
  emerging_markets: ['VWO', 'IEMG', 'EEM', 'SCHE'],
  etfs: ['SPY', 'QQQ', 'VTI', 'IVV', 'VOO']
};

async function getAssetMetrics(symbol: string) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const result = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });

    if (!result || result.length === 0) {
      throw new Error(`No data returned for ${symbol}`);
    }

    const prices = result.map(item => item.close);
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    
    const expectedReturn = (returns.reduce((sum, ret) => sum + ret, 0) / returns.length) * 252 * 100; // Annualized return
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - (expectedReturn/252/100), 2), 0) / returns.length) * Math.sqrt(252) * 100; // Annualized volatility
    const sharpeRatio = (expectedReturn - RISK_FREE_RATE) / volatility;

    // Get the display name for the asset
    let name = symbol;
    try {
      const quote = await yahooFinance.quote(symbol);
      name = quote.shortName || quote.longName || symbol;
    } catch (error) {
      console.warn(`Could not fetch name for ${symbol}, using symbol instead`);
    }

    return { 
      expectedReturn, 
      volatility,
      sharpeRatio,
      name
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    throw error;
  }
}

type AssetMetrics = {
  symbol: string;
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  name: string;
};

type RiskAllocation = {
  stocks: number;
  bonds: number;
  crypto: number;
  mutual_funds: number;
  emerging_markets: number;
  etfs: number;
};

const baseAllocations: Record<1 | 2 | 3 | 4 | 5, RiskAllocation> = {
  1: { stocks: 20, bonds: 50, crypto: 0, mutual_funds: 15, emerging_markets: 5, etfs: 10 },
  2: { stocks: 30, bonds: 40, crypto: 0, mutual_funds: 15, emerging_markets: 5, etfs: 10 },
  3: { stocks: 40, bonds: 25, crypto: 5, mutual_funds: 15, emerging_markets: 5, etfs: 10 },
  4: { stocks: 50, bonds: 15, crypto: 10, mutual_funds: 10, emerging_markets: 5, etfs: 10 },
  5: { stocks: 60, bonds: 5, crypto: 15, mutual_funds: 5, emerging_markets: 5, etfs: 10 }
};

function getRiskScore(riskTolerance: number): 1 | 2 | 3 | 4 | 5 {
  if (riskTolerance <= 20) return 1;
  if (riskTolerance <= 40) return 2;
  if (riskTolerance <= 60) return 3;
  if (riskTolerance <= 80) return 4;
  return 5;
}

// Modify base allocations to be more dynamic based on market conditions
const getBaseAllocations = (riskScore: 1 | 2 | 3 | 4 | 5, assetMetrics: Record<AssetCategory, AssetMetrics[]>): RiskAllocation => {
  // Check if all bonds have negative expected returns
  const allBondsNegative = assetMetrics.bonds?.every(bond => bond.expectedReturn < 0);
  
  // If all bonds have negative returns, redistribute their allocation to other assets
  if (allBondsNegative) {
    const noBonus = {
      1: { stocks: 35, bonds: 0, crypto: 0, mutual_funds: 40, emerging_markets: 10, etfs: 15 },
      2: { stocks: 45, bonds: 0, crypto: 0, mutual_funds: 35, emerging_markets: 10, etfs: 10 },
      3: { stocks: 50, bonds: 0, crypto: 10, mutual_funds: 25, emerging_markets: 5, etfs: 10 },
      4: { stocks: 55, bonds: 0, crypto: 15, mutual_funds: 15, emerging_markets: 5, etfs: 10 },
      5: { stocks: 65, bonds: 0, crypto: 15, mutual_funds: 10, emerging_markets: 5, etfs: 5 }
    };
    return noBonus[riskScore];
  }

  // Default allocations when bonds have positive returns
  return baseAllocations[riskScore];
};

export async function POST(req: NextRequest) {
  try {
    const { riskTolerance, amount: investmentAmount, assetTypes } = await req.json();
    const riskScore = getRiskScore(riskTolerance);

    // Filter assets based on selected asset types
    const selectedAssetTypes = (assetTypes as AssetCategory[]).reduce((acc: Partial<Record<AssetCategory, string[]>>, type: AssetCategory) => {
      if (availableAssets[type]) {
        acc[type] = availableAssets[type];
      }
      return acc;
    }, {});

    // Calculate metrics for all assets
    const assetMetrics: Record<AssetCategory, AssetMetrics[]> = {} as Record<AssetCategory, AssetMetrics[]>;
    
    for (const [category, symbols] of Object.entries(selectedAssetTypes)) {
      const metrics = await Promise.all(
        symbols.map(async (symbol: string) => {
          const metrics = await getAssetMetrics(symbol);
          return { symbol, ...metrics };
        })
      );
      
      // Sort assets by Sharpe ratio and pick top performers based on risk score
      assetMetrics[category as AssetCategory] = metrics.sort((a, b) => b.sharpeRatio - a.sharpeRatio);
    }

    // Get dynamic base allocations based on market conditions
    const dynamicAllocations = getBaseAllocations(riskScore, assetMetrics);

    // Filter and normalize allocations based on selected asset types
    const filteredBaseAllocations = Object.entries(dynamicAllocations)
      .filter(([type]) => assetTypes.includes(type))
      .reduce((acc, [type, percentage]) => {
        acc[type] = percentage;
        return acc;
      }, {} as Record<string, number>);

    // Normalize percentages to sum to 100
    const totalPercentage = Object.values(filteredBaseAllocations).reduce((sum, p) => sum + p, 0);
    const normalizedBaseAllocations = Object.entries(filteredBaseAllocations).reduce((acc, [type, percentage]) => {
      acc[type] = (percentage / totalPercentage) * 100;
      return acc;
    }, {} as Record<string, number>);

    // Select assets and calculate allocations based on risk score
    const allocation = Object.entries(normalizedBaseAllocations)
      .reduce((acc, [category, percentage]) => {
        const categoryAmount = (investmentAmount * percentage) / 100;
        const assets = assetMetrics[category as AssetCategory];
        
        if (!assets) return acc;

        // Select number of assets based on risk score and category
        const numAssets = Math.min(
          category === 'stocks' ? riskScore + 2 : // More stocks for higher risk
          category === 'crypto' ? Math.max(1, Math.floor(riskScore / 2)) : // More crypto for higher risk
          2, // Default to 2 assets for other categories
          assets.length
        );

        // Only include assets with positive Sharpe ratios or the best performing ones if all are negative
        const viableAssets = assets
          .filter(asset => asset.expectedReturn > -RISK_FREE_RATE) // Filter out assets performing worse than risk-free rate
          .slice(0, numAssets);

        if (viableAssets.length === 0) {
          // If no viable assets in category, redistribute to other categories
          return acc;
        }

        const totalSharpeRatio = viableAssets.reduce((sum, asset) => sum + Math.max(0.1, asset.sharpeRatio), 0);
        
        // Allocate within category based on Sharpe ratios
        const categoryAllocation = viableAssets.reduce((categoryAcc, asset) => {
          const assetWeight = Math.max(0.1, asset.sharpeRatio) / totalSharpeRatio;
          const assetAmount = categoryAmount * assetWeight;
          
          categoryAcc[asset.symbol] = {
            name: asset.name,
            amount: assetAmount,
            percentage: (assetAmount / investmentAmount) * 100,
            expectedReturn: asset.expectedReturn,
            volatility: asset.volatility,
            sharpeRatio: asset.sharpeRatio
          };
          
          return categoryAcc;
        }, {} as Record<string, any>);

        acc[category] = {
          amount: categoryAmount,
          percentage,
          expectedReturn: viableAssets.reduce((sum, asset) => sum + asset.expectedReturn, 0) / viableAssets.length,
          volatility: Math.sqrt(viableAssets.reduce((sum, asset) => sum + Math.pow(asset.volatility, 2), 0) / viableAssets.length),
          assets: categoryAllocation
        };
        
        return acc;
      }, {} as Record<string, any>);

    // Calculate overall portfolio metrics
    const portfolioReturn = Object.values(allocation).reduce(
      (sum, category: any) => sum + (category.expectedReturn * category.percentage / 100),
      0
    );

    const portfolioVolatility = Math.sqrt(
      Object.values(allocation).reduce(
        (sum, category: any) => sum + Math.pow(category.volatility * category.percentage / 100, 2),
        0
      )
    );

    const sharpeRatio = (portfolioReturn - RISK_FREE_RATE) / portfolioVolatility;

    return NextResponse.json({
      allocation,
      metrics: {
        expectedReturn: portfolioReturn,
        volatility: portfolioVolatility,
        sharpeRatio
      }
    });

  } catch (error) {
    console.error('Error in portfolio optimization:', error);
    return NextResponse.json(
      { error: 'Failed to optimize portfolio' },
      { status: 500 }
    );
  }
} 