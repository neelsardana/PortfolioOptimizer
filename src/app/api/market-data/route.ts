import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

type MarketData = {
  date: string;
  value: number;
};

let cachedData: {
  sp500: MarketData[];
  nasdaq: MarketData[];
  timestamp: number;
} | null = null;

async function fetchMarketData(symbol: string) {
  const currentDate = new Date();
  const endDate = new Date(currentDate);
  endDate.setMonth(currentDate.getMonth() + 6); // 6 months into the future
  
  const startDate = new Date(currentDate);
  startDate.setMonth(currentDate.getMonth() - 6); // 6 months into the past

  const queryOptions = {
    period1: startDate,
    period2: endDate,
    interval: '1d' as const
  };

  const result = await yahooFinance.historical(symbol, queryOptions);
  
  if (!result || result.length === 0) {
    throw new Error(`Failed to fetch data for ${symbol}`);
  }

  // Ensure we have data points for each month
  const monthlyData: { [key: string]: number } = {};
  
  // Generate all months between start and end date
  let currentMonth = new Date(startDate);
  while (currentMonth <= endDate) {
    const monthKey = currentMonth.toISOString().slice(0, 7); // YYYY-MM format
    monthlyData[monthKey] = 0; // Initialize with 0, will be updated if we have data
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  // Fill in actual data where we have it
  result.forEach(item => {
    const monthKey = item.date.toISOString().slice(0, 7);
    if (monthKey in monthlyData) {
      monthlyData[monthKey] = item.close;
    }
  });

  // For future months where we don't have data, use the last known value
  let lastValue = result[result.length - 1]?.close || 100;
  Object.keys(monthlyData).sort().forEach(monthKey => {
    if (monthlyData[monthKey] === 0) {
      monthlyData[monthKey] = lastValue;
    } else {
      lastValue = monthlyData[monthKey];
    }
  });

  // Convert to array and sort by date
  return Object.entries(monthlyData)
    .map(([date, value]) => ({
      date: date + '-01', // Use first day of each month
      value
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function GET() {
  try {
    // Check if we have valid cached data
    if (
      cachedData &&
      Date.now() - cachedData.timestamp < CACHE_DURATION
    ) {
      return NextResponse.json(cachedData);
    }

    // Fetch fresh data
    const [sp500Data, nasdaqData] = await Promise.all([
      fetchMarketData('^GSPC'), // S&P 500 Index
      fetchMarketData('^IXIC')  // NASDAQ Composite Index
    ]);

    // Calculate percentage change from first value
    const normalizeData = (data: MarketData[]) => {
      const baseValue = data[0].value;
      return data.map(item => ({
        date: item.date,
        value: (item.value / baseValue) * 100
      }));
    };

    const newData = {
      sp500: normalizeData(sp500Data),
      nasdaq: normalizeData(nasdaqData),
      timestamp: Date.now()
    };

    cachedData = newData;
    return NextResponse.json(newData);

  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
} 