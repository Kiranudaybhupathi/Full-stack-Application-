export type AssetGroup = 'stocks' | 'crypto' | 'etfs' | 'forex' | 'cfds';

export interface PriceHistoryPoint {
  time: string;
  price: number;
}

export interface StockAsset {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  changeAmount: number;
  history: Record<'1D' | '1W' | '1M' | '3M' | '1Y', PriceHistoryPoint[]>;
  group: AssetGroup;
  about: string;
  ceo?: string;
  employees?: string;
  industry?: string;
  marketCap: string;
  peRatio: string;
  divYield: string;
  high24h: number;
  low24h: number;
  openPrice: number;
  leverageMultiplier?: number; // for CFDs
}

export interface PortfolioPosition {
  symbol: string;
  shares: number; // fractional shares supported
  averageBuyPrice: number;
  investedAmount: number;
  leverageMultiplier?: number; // for CFDs, tracks the initial leverage
  isShort?: boolean; // CFD allows short selling
}

export type OrderType = 'MARKET' | 'LIMIT';
export type OrderSide = 'BUY' | 'SELL' | 'SHORT' | 'COVER';

export interface Order {
  id: string;
  symbol: string;
  name: string;
  type: OrderType;
  side: OrderSide;
  shares: number;
  price: number; // Execution price (or execution target for limit orders)
  limitPrice?: number; // Target price for limit order
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  timestamp: string;
}

export interface AccountState {
  cash: number; // free funds available to invest
  invested: number; // value of active holdings
  totalValue: number; // cash + invested
  pnl: number; // total profit/loss
  pnlPercent: number; // profit/loss percentage
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface FinancialNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  timeString: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  symbol?: string; // Associated stocks
}
