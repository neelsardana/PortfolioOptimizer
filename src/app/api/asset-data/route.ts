import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { NextRequest } from 'next/server';

// Simple moving average calculation
function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

// Exponential moving average calculation
function calculateEMA(prices: number[], period: number): number[] {
  const multiplier = 2 / (period + 1);
  const ema: number[] = [prices[0]];
  
  for (let i = 1; i < prices.length; i++) {
    const currentEMA: number = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(currentEMA);
  }
  
  return ema;
}

// Calculate RSI
function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi = [];
  const changes = data.slice(1).map((price, i) => price - data[i]);
  
  let gains = changes.map(change => change > 0 ? change : 0);
  let losses = changes.map(change => change < 0 ? -change : 0);
  
  // Calculate initial average gain and loss
  const avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
  const avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
  
  let prevAvgGain = avgGain;
  let prevAvgLoss = avgLoss;
  
  // First RSI value
  rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
  
  // Calculate RSI for remaining periods
  for (let i = period + 1; i < data.length; i++) {
    const currentGain = gains[i - 1];
    const currentLoss = losses[i - 1];
    
    const smoothedAvgGain = (prevAvgGain * (period - 1) + currentGain) / period;
    const smoothedAvgLoss = (prevAvgLoss * (period - 1) + currentLoss) / period;
    
    prevAvgGain = smoothedAvgGain;
    prevAvgLoss = smoothedAvgLoss;
    
    const rs = smoothedAvgGain / smoothedAvgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
}

// Monte Carlo simulation with confidence intervals
type ForecastResult = {
  forecast: number[];
  upperCI90: number[];
  upperCI80: number[];
  upperCI50: number[];
  lowerCI50: number[];
  lowerCI80: number[];
  lowerCI90: number[];
};

function generatePriceForecast(prices: number[]): ForecastResult {
  const NUM_SIMULATIONS = 1000;
  const FORECAST_DAYS = 90;
  
  // Calculate returns and volatility
  const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const volatility = Math.sqrt(
    returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
  );

  // Calculate technical indicators for trend adjustment
  const shortEMA = calculateEMA(prices, 12);
  const longEMA = calculateEMA(prices, 26);
  const rsi = calculateRSI(prices);
  const lastPrice = prices[prices.length - 1];
  
  // Adjust trend based on technical indicators
  const trendStrength = (shortEMA[shortEMA.length - 1] - longEMA[longEMA.length - 1]) / longEMA[longEMA.length - 1];
  const rsiAdjustment = (rsi[rsi.length - 1] - 50) / 100;
  const adjustedReturn = avgReturn + (trendStrength * 0.1) - (rsiAdjustment * 0.05);

  // Run Monte Carlo simulation
  const simulations: number[][] = [];
  
  for (let sim = 0; sim < NUM_SIMULATIONS; sim++) {
    const path: number[] = [lastPrice];
    
    for (let day = 1; day <= FORECAST_DAYS; day++) {
      const previousPrice = path[day - 1];
      const randomWalk = Math.random() * 2 - 1; // Random number between -1 and 1
      const dailyReturn = adjustedReturn + (volatility * randomWalk);
      const dampingFactor = Math.max(0, 1 - (day / (FORECAST_DAYS * 2))); // Reduce volatility over time
      const newPrice = previousPrice * Math.exp(dailyReturn * dampingFactor);
      path.push(newPrice);
    }
    
    simulations.push(path);
  }

  // Calculate mean forecast and confidence intervals
  const forecast: number[] = [];
  const upperCI90: number[] = [];
  const upperCI80: number[] = [];
  const upperCI50: number[] = [];
  const lowerCI50: number[] = [];
  const lowerCI80: number[] = [];
  const lowerCI90: number[] = [];

  for (let day = 0; day <= FORECAST_DAYS; day++) {
    const pricesAtDay = simulations.map(sim => sim[day]).sort((a, b) => a - b);
    const meanPrice = pricesAtDay.reduce((sum, price) => sum + price, 0) / NUM_SIMULATIONS;
    
    forecast.push(meanPrice);
    upperCI90.push(pricesAtDay[Math.floor(NUM_SIMULATIONS * 0.95)]);
    upperCI80.push(pricesAtDay[Math.floor(NUM_SIMULATIONS * 0.90)]);
    upperCI50.push(pricesAtDay[Math.floor(NUM_SIMULATIONS * 0.75)]);
    lowerCI50.push(pricesAtDay[Math.floor(NUM_SIMULATIONS * 0.25)]);
    lowerCI80.push(pricesAtDay[Math.floor(NUM_SIMULATIONS * 0.10)]);
    lowerCI90.push(pricesAtDay[Math.floor(NUM_SIMULATIONS * 0.05)]);
  }

  return {
    forecast,
    upperCI90,
    upperCI80,
    upperCI50,
    lowerCI50,
    lowerCI80,
    lowerCI90
  };
}

// Determine buy/sell recommendation
function getRecommendation(historicalPrices: number[], forecastPrices: number[]): {
  action: 'Buy' | 'Sell' | 'Hold';
  confidence: number;
  reasoning: string;
} {
  const lastPrice = historicalPrices[historicalPrices.length - 1];
  const futurePrice = forecastPrices[forecastPrices.length - 1];
  const priceChange = ((futurePrice - lastPrice) / lastPrice) * 100;
  
  const sma50 = calculateSMA(historicalPrices, 50);
  const rsi = calculateRSI(historicalPrices);
  const lastRSI = rsi[rsi.length - 1];
  
  let action: 'Buy' | 'Sell' | 'Hold';
  let confidence: number;
  let reasoning: string;
  
  if (priceChange > 5 && lastRSI < 70) {
    action = 'Buy';
    confidence = Math.min(85, 60 + Math.abs(priceChange));
    reasoning = `Strong upward trend with ${priceChange.toFixed(1)}% projected growth and favorable RSI.`;
  } else if (priceChange < -5 || lastRSI > 70) {
    action = 'Sell';
    confidence = Math.min(85, 60 + Math.abs(priceChange));
    reasoning = `Bearish indicators with ${Math.abs(priceChange).toFixed(1)}% projected decline and overbought conditions.`;
  } else {
    action = 'Hold';
    confidence = 70;
    reasoning = 'Market conditions suggest maintaining current position.';
  }
  
  return { action, confidence, reasoning };
}

async function resolveSymbol(query: string): Promise<string> {
  try {
    // If the query is already a valid symbol (all caps, 1-5 characters), use it directly
    if (/^[A-Z]{1,5}$/.test(query)) {
      return query;
    }

    // Search for the symbol using Yahoo Finance search
    const searchResults = await yahooFinance.search(query, { 
      newsCount: 0,
      quotesCount: 1,
      enableFuzzyQuery: true 
    });

    if (searchResults.quotes && searchResults.quotes.length > 0) {
      return searchResults.quotes[0].symbol;
    }

    throw new Error('No matching symbol found');
  } catch (error) {
    throw new Error('Failed to resolve symbol');
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('symbol');

  if (!query) {
    return NextResponse.json({ error: 'Symbol or company name is required' }, { status: 400 });
  }

  try {
    // Resolve the query to a symbol
    const symbol = await resolveSymbol(query.trim());

    // Fetch historical data from Yahoo Finance
    const result = await yahooFinance.chart(symbol, {
      period1: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago
      period2: new Date(),
      interval: '1d'
    });

    // Fetch quote for additional details
    const quote = await yahooFinance.quote(symbol);

    if (!result.quotes || result.quotes.length === 0) {
      return NextResponse.json({ error: 'No data available for this symbol' }, { status: 404 });
    }

    // Process historical data
    const dates = result.quotes.map(quote => 
      new Date(quote.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    );
    
    // Filter out any null values and convert to numbers
    const validPrices = result.quotes
      .map(quote => quote.close)
      .filter((price): price is number => price !== null && !isNaN(price));

    if (validPrices.length < 2) {
      return NextResponse.json({ error: 'Insufficient price data available' }, { status: 400 });
    }

    // Calculate price changes
    const currentPrice = validPrices[validPrices.length - 1];
    const previousPrice = validPrices[validPrices.length - 2];
    const priceChange = currentPrice - previousPrice;
    const priceChangePercent = (priceChange / previousPrice) * 100;

    // Generate forecast with confidence intervals
    const forecastResult = generatePriceForecast(validPrices);
    const recommendation = getRecommendation(validPrices, forecastResult.forecast);

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      name: quote.longName || quote.shortName,
      currentPrice,
      priceChange,
      priceChangePercent,
      marketCap: quote.marketCap,
      volume: quote.regularMarketVolume,
      dates,
      prices: validPrices,
      forecast: forecastResult.forecast,
      upperCI90: forecastResult.upperCI90,
      upperCI80: forecastResult.upperCI80,
      upperCI50: forecastResult.upperCI50,
      lowerCI50: forecastResult.lowerCI50,
      lowerCI80: forecastResult.lowerCI80,
      lowerCI90: forecastResult.lowerCI90,
      recommendation: recommendation.action,
      confidence: recommendation.confidence,
      reasoning: recommendation.reasoning
    });

  } catch (error) {
    console.error('Error fetching asset data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset data' },
      { status: 500 }
    );
  }
} 