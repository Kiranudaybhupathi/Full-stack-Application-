import { StockAsset, PriceHistoryPoint } from '../types';

// Let's establish the raw asset specifications
const BASE_ASSETS = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 182.41,
    group: 'stocks' as const,
    about: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company also sells various related services, including Apple Music, Apple TV+, App Store, and iCloud.',
    ceo: 'Tim Cook',
    employees: '164,000',
    industry: 'Consumer Electronics',
    marketCap: '2.84T',
    peRatio: '29.3',
    divYield: '0.52%',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 179.24,
    group: 'stocks' as const,
    about: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems in the United States, China, and internationally. Operating both Automotive and Energy divisions.',
    ceo: 'Elon Musk',
    employees: '140,473',
    industry: 'Automotive & Clean Energy',
    marketCap: '568B',
    peRatio: '61.4',
    divYield: 'N/A',
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 942.89,
    group: 'stocks' as const,
    about: 'NVIDIA Corporation provides graphics, and compute and networking solutions worldwide. Its Graphics segment offers GeForce GPUs for gaming and PCs. Its Compute & Networking segment offers Data Center platforms, AI solutions, and automotive cockpits.',
    ceo: 'Jensen Huang',
    employees: '29,600',
    industry: 'Semiconductors & AI',
    marketCap: '2.35T',
    peRatio: '78.5',
    divYield: '0.02%',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 421.90,
    group: 'stocks' as const,
    about: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. The company operates through Productivity and Business Processes, Intelligent Cloud, and More Personal Computing segments.',
    ceo: 'Satya Nadella',
    employees: '221,000',
    industry: 'Systems & Cloud Software',
    marketCap: '3.13T',
    peRatio: '36.1',
    divYield: '0.71%',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 168.45,
    group: 'stocks' as const,
    about: 'Alphabet Inc. provides Google search and advertising services, Google Maps, YouTube, Google Cloud, and hardware physical devices. It also invests in speculative "Other Bets" research ventures.',
    ceo: 'Sundar Pichai',
    employees: '182,502',
    industry: 'Internet & Search Engines',
    marketCap: '2.08T',
    peRatio: '25.8',
    divYield: '0.48%',
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    price: 181.28,
    group: 'stocks' as const,
    about: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally. Services include retail store logistics, AWS cloud infrastructure, Prime Video, and advertising operations.',
    ceo: 'Andy Jassy',
    employees: '1,541,000',
    industry: 'E-Commerce & Cloud Computing',
    marketCap: '1.88T',
    peRatio: '40.2',
    divYield: 'N/A',
  },
  {
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    price: 462.15,
    group: 'etfs' as const,
    about: 'Vanguard S&P 500 ETF is an exchange-traded fund that tracks the investment return of the S&P 500 Index, representing the performance of the 500 largest US publicly traded companies across all industry groups.',
    ceo: 'Tim Buckley',
    employees: 'N/A',
    industry: 'Investment Fund',
    marketCap: '412B',
    peRatio: '24.1',
    divYield: '1.38%',
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ ETF',
    price: 441.80,
    group: 'etfs' as const,
    about: 'Invesco QQQ Trust is an exchange-traded fund based on the Nasdaq-100 Index. The Portfolio includes 100 of the largest non-financial tech-focused US and international companies on the Nasdaq.',
    ceo: 'Invesco Ltd.',
    employees: 'N/A',
    industry: 'Investment Fund',
    marketCap: '228B',
    peRatio: '32.5',
    divYield: '0.58%',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin (Cryptocurrency)',
    price: 67340.50,
    group: 'crypto' as const,
    about: 'Bitcoin is a decentralized cryptocurrency first described in a 2008 whitepaper by a person or group under the pseudonym Satoshi Nakamoto. It relies on a proof-of-work blockchain ledger network.',
    ceo: 'Decentralized',
    employees: 'N/A',
    industry: 'Blockchain Digital Asset',
    marketCap: '1.32T',
    peRatio: 'N/A',
    divYield: 'N/A',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum (Cryptocurrency)',
    price: 3495.20,
    group: 'crypto' as const,
    about: 'Ethereum is a smart contract ledger platform for decentralized applications, powered by its native coin, Ether (ETH), utilizing a proof-of-stake governance system.',
    ceo: 'Decentralized',
    employees: 'N/A',
    industry: 'Smart Contract Ledger',
    marketCap: '419B',
    peRatio: 'N/A',
    divYield: 'N/A',
  },
  {
    symbol: 'EURUSD',
    name: 'EUR / USD Forex Pair',
    price: 1.0842,
    group: 'forex' as const,
    about: 'The Euro vs US Dollarcurrency pair specifies the exchange rate representing how many US Dollars are needed to purchase one Euro.',
    ceo: 'Centrally Governed',
    employees: 'N/A',
    industry: 'Foreign Currency Exchange',
    marketCap: 'N/A',
    peRatio: 'N/A',
    divYield: 'N/A',
  },
  {
    symbol: 'GBPUSD',
    name: 'GBP / USD Forex Pair',
    price: 1.2584,
    group: 'forex' as const,
    about: 'The British Pound sterling vs US Dollar currency pair specifies the exchange rate representing how many Dollars are needed to purchase one Great Britain Pound.',
    ceo: 'Centrally Governed',
    employees: 'N/A',
    industry: 'Foreign Currency Exchange',
    marketCap: 'N/A',
    peRatio: 'N/A',
    divYield: 'N/A',
  },
  // CFD Stocks (Leveraged)
  {
    symbol: 'CFD_TSLA_5X',
    name: 'Tesla Inc. (5x Leverage)',
    price: 179.24,
    group: 'cfds' as const,
    about: 'CFD (Contract for Difference) allows trading TSLA shares with a 1:5 margin (leverage). Returns are amplified by 5x (both positive and negative). CFD supports short positions without holding the asset.',
    ceo: 'Elon Musk',
    employees: '140,473',
    industry: 'CFD Invest Products',
    marketCap: 'N/A (Derived)',
    peRatio: '61.4',
    divYield: 'N/A',
    leverageMultiplier: 5,
  },
  {
    symbol: 'CFD_NVDA_5X',
    name: 'NVIDIA Corporation (5x Leverage)',
    price: 942.89,
    group: 'cfds' as const,
    about: 'CFD allows trading NVIDIA Corporation shares with a 1:5 margin. Yields are multiplied by 5x. CFDs carry high risk due to the margin multiplier.',
    ceo: 'Jensen Huang',
    employees: '29,600',
    industry: 'CFD Invest Products',
    marketCap: 'N/A (Derived)',
    peRatio: '78.5',
    divYield: '0.02%',
    leverageMultiplier: 5,
  },
  {
    symbol: 'CFD_GOLD_10X',
    name: 'Gold Commodity (10x Leverage)',
    price: 2380.40,
    group: 'cfds' as const,
    about: 'Spot Gold commodity valued in USD (XAU/USD) traded as a leveraged CFD with a 10x margin multiplier.',
    ceo: 'COMEX Exchange',
    employees: 'N/A',
    industry: 'Commodities CFD',
    marketCap: '15.6T (Physical)',
    peRatio: 'N/A',
    divYield: 'N/A',
    leverageMultiplier: 10,
  }
];

// Helper to construct a plausible price series backwards in time.
// timeframes: 1D (24 points, hourly), 1W (24 points, multi-hourly), 1M (30 points, daily), 3M (30 points, multi-daily), 1Y (60 points, weekly)
function generateHistory(currentPrice: number, pointsCount: number, dailyVolatility: number): PriceHistoryPoint[] {
  const points: PriceHistoryPoint[] = [];
  let tracker = currentPrice;

  // Let's generate chronological points (oldest first).
  // Walk backwards to construct, then reverse
  for (let i = 0; i < pointsCount; i++) {
    const timeIndex = pointsCount - 1 - i;
    // Walk back with some brownian motion
    const change = (Math.random() - 0.495) * dailyVolatility * tracker; // slight positive drift
    tracker = Math.max(0.0001, tracker - change);
    points.push({
      time: `T-${timeIndex}`, // Default generic indicator, will format dynamically depending on timeframe
      price: Number(tracker.toFixed(tracker < 10 ? 4 : 2)),
    });
  }

  // Reverse so chronological oldest is first, currentPrice is LAST
  points.reverse();
  // Ensure the exact last value is exactly the currentPrice!
  points[points.length - 1].price = currentPrice;

  return points;
}

// Generate the final list of stock assets
export function generateStockAssets(): StockAsset[] {
  return BASE_ASSETS.map((asset) => {
    // Volatility levels based on category
    let volatility = 0.012; // 1.2% daily for stable stocks
    if (asset.group === 'crypto') volatility = 0.025; // 2.5% daily for cryptos
    if (asset.group === 'forex') volatility = 0.003; // 0.3% daily for forex

    const currentPrice = asset.price;

    const history1D = generateHistory(currentPrice, 24, volatility / 4).map((pt, idx) => {
      const hour = String((idx + 1) % 24).padStart(2, '0');
      pt.time = `${hour}:00`;
      return pt;
    });

    const history1W = generateHistory(currentPrice, 24, volatility / 2).map((pt, idx) => {
      const daySuffixes = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayIndex = Math.floor(idx / 3.4) % 7;
      pt.time = `${daySuffixes[dayIndex]} ${((idx % 3) * 8)}:00`;
      return pt;
    });

    const history1M = generateHistory(currentPrice, 30, volatility).map((pt, idx) => {
      pt.time = `Day ${idx + 1}`;
      return pt;
    });

    const history3M = generateHistory(currentPrice, 30, volatility * 1.8).map((pt, idx) => {
      const weekNum = Math.floor(idx / 2) + 1;
      pt.time = `Wk ${weekNum}`;
      return pt;
    });

    const history1Y = generateHistory(currentPrice, 52, volatility * 3.5).map((pt, idx) => {
      const monthPrefixes = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = Math.floor(idx / 4.4) % 12;
      pt.time = `${monthPrefixes[monthIdx]}`;
      return pt;
    });

    // Compute synthetic 24h stats
    const openPriceVal = Number((currentPrice * (1 + (Math.random() - 0.5) * 0.03)).toFixed(currentPrice < 10 ? 4 : 2));
    const high24hVal = Number((Math.max(currentPrice, openPriceVal) * (1 + Math.random() * 0.015)).toFixed(currentPrice < 10 ? 4 : 2));
    const low24hVal = Number((Math.min(currentPrice, openPriceVal) * (1 - Math.random() * 0.015)).toFixed(currentPrice < 10 ? 4 : 2));

    const pctChange = Number((((currentPrice - openPriceVal) / openPriceVal) * 100).toFixed(2));
    const amtChange = Number((currentPrice - openPriceVal).toFixed(currentPrice < 10 ? 4 : 2));

    return {
      symbol: asset.symbol,
      name: asset.name,
      price: currentPrice,
      changePercent: pctChange,
      changeAmount: amtChange,
      group: asset.group,
      about: asset.about,
      ceo: asset.ceo,
      employees: asset.employees,
      industry: asset.industry,
      marketCap: asset.marketCap,
      peRatio: asset.peRatio,
      divYield: asset.divYield,
      high24h: high24hVal,
      low24h: low24hVal,
      openPrice: openPriceVal,
      leverageMultiplier: asset.leverageMultiplier,
      history: {
        '1D': history1D,
        '1W': history1W,
        '1M': history1M,
        '3M': history3M,
        '1Y': history1Y,
      },
    };
  });
}

// Utility to apply small real-time fluctuations (quotes blinking)
export function simulatePriceTick(stock: StockAsset): StockAsset {
  let tickFactor = 0.001; // tiny ticker changes
  if (stock.group === 'crypto') tickFactor = 0.002;
  if (stock.group === 'forex') tickFactor = 0.0002;

  const changePercent = (Math.random() - 0.495) * tickFactor; // slight positive upward potential
  const currentPrice = Number((stock.price * (1 + changePercent)).toFixed(stock.price < 10 ? 4 : 2));
  const changeAmount = Number((currentPrice - stock.openPrice).toFixed(stock.price < 10 ? 4 : 2));
  const changePercentTotal = Number((((currentPrice - stock.openPrice) / stock.openPrice) * 100).toFixed(2));

  // Update dynamic high/low metrics
  const high24h = Number(Math.max(stock.high24h, currentPrice).toFixed(stock.price < 10 ? 4 : 2));
  const low24h = Number(Math.min(stock.low24h, currentPrice).toFixed(stock.price < 10 ? 4 : 2));

  // Append new point to 1D history (replaces the last element with current price or shifts)
  const updatedHistory = { ...stock.history };
  const d1Points = [...updatedHistory['1D']];
  if (d1Points.length > 0) {
    const lastPoint = d1Points[d1Points.length - 1];
    d1Points[d1Points.length - 1] = {
      ...lastPoint,
      price: currentPrice
    };
    updatedHistory['1D'] = d1Points;
  }

  return {
    ...stock,
    price: currentPrice,
    changePriceFluctuation: changePercent > 0 ? 'UP' : 'DOWN', // flag for blinking effect
    changePercent: changePercentTotal,
    changeAmount,
    high24h,
    low24h,
    history: updatedHistory
  } as StockAsset & { changePriceFluctuation?: 'UP' | 'DOWN' };
}
