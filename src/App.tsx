import React, { useState, useEffect, useMemo } from 'react';
import { generateStockAssets, simulatePriceTick } from './data/stocks';
import { StockAsset, PortfolioPosition, Order, AccountState, OrderType, OrderSide, AssetGroup } from './types';
import Navigation from './components/Navigation';
import InteractiveChart from './components/InteractiveChart';
import OrderForm from './components/OrderForm';
import PortfolioOverview from './components/PortfolioOverview';
import NewsSection from './components/NewsSection';
import AICopilotSidebar from './components/AICopilotSidebar';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  TrendingUp as TrendIcon, 
  Bell, 
  Sparkles, 
  ChevronRight, 
  ArrowUpRight 
} from 'lucide-react';

const INITIAL_CASH = 50000;

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('invest');

  // Load assets state (initial generated with random curves)
  const [assets, setAssets] = useState<StockAsset[]>(() => generateStockAssets());
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>('AAPL');

  // Search and general filter panel
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGroupFilter, setActiveGroupFilter] = useState<AssetGroup | 'ALL'>('ALL');

  // Load portfolio from localStorage if available, or initialize empty
  const [portfolio, setPortfolio] = useState<PortfolioPosition[]>(() => {
    const saved = localStorage.getItem('trading212_portfolio');
    return saved ? JSON.parse(saved) : [];
  });

  // Load pending orders from localStorage
  const [pendingOrders, setPendingOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('trading212_pending_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Load account cash balance
  const [account, setAccount] = useState<AccountState>(() => {
    const savedPortfolio = localStorage.getItem('trading212_portfolio');
    const savedCash = localStorage.getItem('trading212_cash');
    const cashVal = savedCash ? parseFloat(savedCash) : INITIAL_CASH;
    
    return {
      cash: cashVal,
      invested: 0,
      totalValue: cashVal,
      pnl: 0,
      pnlPercent: 0
    };
  });

  // Alert triggers system for limit execution alerts etc.
  const [alerts, setAlerts] = useState<{ id: string; text: string; type: 'success' | 'info' }[]>([]);

  const addAlert = (text: string, type: 'success' | 'info' = 'success') => {
    const id = `alert_${Date.now()}`;
    setAlerts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  // Find currently selected stock asset info
  const activeAsset = useMemo(() => {
    return assets.find(a => a.symbol === selectedAssetSymbol) || assets[0];
  }, [assets, selectedAssetSymbol]);

  // Sync state data structures to browser storage on edits
  useEffect(() => {
    localStorage.setItem('trading212_portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem('trading212_pending_orders', JSON.stringify(pendingOrders));
  }, [pendingOrders]);

  useEffect(() => {
    localStorage.setItem('trading212_cash', account.cash.toString());
  }, [account.cash]);

  // Handle active symbol selection from other components
  const selectAssetBySymbol = (symbol: string) => {
    setSelectedAssetSymbol(symbol);
    // Auto shift back to markets/CFDs tabs to inspect chart
    const asset = assets.find(a => a.symbol === symbol);
    if (asset) {
      if (asset.group === 'cfds') {
        setActiveTab('cfd');
      } else {
        setActiveTab('invest');
      }
    }
  };

  // 1. PRICE TICKING SIMULATOR & LIMIT ORDER BOOK MATCHING ENGINE
  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate prices across all market assets
      setAssets(prevAssets => {
        const nextAssets = prevAssets.map(asset => simulatePriceTick(asset));

        // Evaluate outstanding limit orders
        setPendingOrders(prevOrders => {
          const filled: Order[] = [];
          const remaining = prevOrders.filter(order => {
            const currentAsset = nextAssets.find(a => a.symbol === order.symbol);
            if (!currentAsset) return true;

            const price = currentAsset.price;
            const target = order.limitPrice || order.price;

            let isTriggered = false;
            if (order.side === 'BUY') {
              // Buy triggers if market price is less than or equals to target
              isTriggered = price <= target;
            } else if (order.side === 'SHORT' || order.side === 'SELL') {
              // Selling or Short triggers if market price is greater than or equals to target
              isTriggered = price >= target;
            }

            if (isTriggered) {
              filled.push({
                ...order,
                price: price, // executes at current actual ticked price
                status: 'EXECUTED',
                timestamp: new Date().toISOString()
              });
              return false; // remove from pending
            }
            return true; // keep pending
          });

          // Process and executes triggered orders
          if (filled.length > 0) {
            filled.forEach(order => {
              // Execute the buy or sale internally
              executeFilledOrder(order);
            });
          }

          return remaining;
        });

        return nextAssets;
      });
    }, 3500); // 3.5 seconds price update loops

    return () => clearInterval(interval);
  }, [portfolio, account.cash, pendingOrders]);

  // Dynamically recalculate total account valuation based on live changes to asset prices
  useEffect(() => {
    let currentInvestedSum = 0;

    portfolio.forEach(pos => {
      const activeInfo = assets.find(a => a.symbol === pos.symbol);
      const currentPrice = activeInfo ? activeInfo.price : pos.averageBuyPrice;
      const isShort = !!pos.isShort;
      const leverage = pos.leverageMultiplier || 1;

      // Calculate holding valuation
      const diff = currentPrice - pos.averageBuyPrice;
      const directionalDiff = isShort ? -diff : diff;
      const rawReturnInCash = pos.shares * directionalDiff * leverage;

      currentInvestedSum += pos.investedAmount + rawReturnInCash;
    });

    const totalVal = account.cash + currentInvestedSum;
    const deltaPnL = totalVal - INITIAL_CASH;
    const pnlPct = (deltaPnL / INITIAL_CASH) * 100;

    setAccount(prev => ({
      ...prev,
      invested: Number(currentInvestedSum.toFixed(2)),
      totalValue: Number(totalVal.toFixed(2)),
      pnl: Number(deltaPnL.toFixed(2)),
      pnlPercent: Number(pnlPct.toFixed(2))
    }));
  }, [assets, portfolio, account.cash]);

  // Helper executing triggered orders (used for Limit Orders)
  const executeFilledOrder = (order: Order) => {
    const isCFD = order.symbol.startsWith('CFD') || order.symbol === 'CFD_GOLD_10X' || order.symbol === 'CFD_TSLA_5X' || order.symbol === 'CFD_NVDA_5X';
    const activeInfo = assets.find(a => a.symbol === order.symbol);
    const multiplier = activeInfo?.leverageMultiplier || 1;
    const isShortOrder = order.side === 'SHORT';

    const transValue = order.shares * order.price;
    const marginRequired = isCFD ? transValue / multiplier : transValue;

    // Execute order into portfolio
    setPortfolio(prev => {
      const idx = prev.findIndex(p => p.symbol === order.symbol && p.isShort === isShortOrder);
      if (idx >= 0) {
        // Average up positions
        const existing = prev[idx];
        const nextShares = existing.shares + order.shares;
        const nextInvested = existing.investedAmount + marginRequired;
        const nextAvg = ((existing.shares * existing.averageBuyPrice) + (order.shares * order.price)) / nextShares;

        const next = [...prev];
        next[idx] = {
          ...existing,
          shares: nextShares,
          investedAmount: nextInvested,
          averageBuyPrice: Number(nextAvg.toFixed(4))
        };
        return next;
      } else {
        // Add completely new position entry
        return [...prev, {
          symbol: order.symbol,
          shares: order.shares,
          averageBuyPrice: order.price,
          investedAmount: marginRequired,
          leverageMultiplier: isCFD ? multiplier : undefined,
          isShort: isShortOrder
        }];
      }
    });

    // Subtract free funds cash
    setAccount(prev => ({
      ...prev,
      cash: Number((prev.cash - marginRequired).toFixed(2))
    }));

    addAlert(`Limit Order Triggered: ${order.side} ${order.shares} share(s) of ${order.symbol} executed at $${order.price.toLocaleString()}`, 'success');
  };

  // 2. SUBMIT DIRECT FORM ORDERS
  const handleMarketOrLimitOrder = (orderConfig: {
    symbol: string;
    type: OrderType;
    side: OrderSide;
    shares: number;
    limitPrice?: number;
  }) => {
    const activeInfo = assets.find(a => a.symbol === orderConfig.symbol);
    if (!activeInfo) return;

    const isCFD = activeInfo.group === 'cfds';
    const leverage = activeInfo.leverageMultiplier || 1;
    const executionPrice = orderConfig.type === 'LIMIT' && orderConfig.limitPrice ? orderConfig.limitPrice : activeInfo.price;

    const totalCost = orderConfig.shares * executionPrice;
    const marginRequired = isCFD ? totalCost / leverage : totalCost;

    if (account.cash < marginRequired) {
      alert('Order Failed: Insufficient funds in virtual cash account.');
      return;
    }

    // A. Handles pending Limit Orders
    if (orderConfig.type === 'LIMIT') {
      const newLimitOrder: Order = {
        id: `limit_${Date.now()}`,
        symbol: orderConfig.symbol,
        name: activeInfo.name,
        type: 'LIMIT',
        side: orderConfig.side,
        shares: orderConfig.shares,
        price: activeInfo.price, // current market price as reference
        limitPrice: orderConfig.limitPrice, // trigger limit target
        status: 'PENDING',
        timestamp: new Date().toISOString()
      };
      setPendingOrders(prev => [...prev, newLimitOrder]);
      addAlert(`Limit order placed successfully: Buy ${orderConfig.shares} ${orderConfig.symbol} when price crosses $${orderConfig.limitPrice}`, 'info');
      setActiveTab('portfolio'); // auto-redirect to see pending queue
      return;
    }

    // B. Handles market order (Instant Execution)
    setPortfolio(prevPortfolio => {
      const isShortOrder = orderConfig.side === 'SHORT' || orderConfig.side === 'SELL' && isCFD;
      
      // Check if position already exists for averaging
      const existingIndex = prevPortfolio.findIndex(
        pos => pos.symbol === orderConfig.symbol && !!pos.isShort === isShortOrder
      );

      if (existingIndex >= 0) {
        const p = prevPortfolio[existingIndex];
        const nextShares = p.shares + orderConfig.shares;
        const nextInvested = p.investedAmount + marginRequired;
        const nextAvg = ((p.shares * p.averageBuyPrice) + (orderConfig.shares * activeInfo.price)) / nextShares;

        const next = [...prevPortfolio];
        next[existingIndex] = {
          ...p,
          shares: nextShares,
          investedAmount: nextInvested,
          averageBuyPrice: Number(nextAvg.toFixed(4))
        };
        return next;
      } else {
        // Form brand-new position
        return [...prevPortfolio, {
          symbol: orderConfig.symbol,
          shares: orderConfig.shares,
          averageBuyPrice: activeInfo.price,
          investedAmount: marginRequired,
          leverageMultiplier: isCFD ? leverage : undefined,
          isShort: isShortOrder
        }];
      }
    });

    // Deduct cash immediately
    setAccount(prev => ({
      ...prev,
      cash: Number((prev.cash - marginRequired).toFixed(2))
    }));

    addAlert(`Order executed successfully: ${orderConfig.side} ${orderConfig.shares} shares of ${orderConfig.symbol} at $${activeInfo.price}`, 'success');
  };

  // 3. SECURELY CLOSE / LIQUIDATE ACTIVE POSITION
  const handleClosePosition = (symbol: string) => {
    const index = portfolio.findIndex(p => p.symbol === symbol);
    if (index < 0) return;

    const pos = portfolio[index];
    const itemInfo = assets.find(a => a.symbol === symbol);
    const activePrice = itemInfo ? itemInfo.price : pos.averageBuyPrice;
    
    const isShort = !!pos.isShort;
    const leverage = pos.leverageMultiplier || 1;

    // Returns math
    const diff = activePrice - pos.averageBuyPrice;
    const directionalDiff = isShort ? -diff : diff;
    const rawPnl = pos.shares * directionalDiff * leverage;
    
    // Total cash recovered: raw margin invested + realized gains / losses (capped to zero value absolute floor)
    const proceeds = Math.max(0, pos.investedAmount + rawPnl);

    // Filter position item from list
    setPortfolio(prev => prev.filter((_, i) => i !== index));

    // Credit proceeds back to free cash balance
    setAccount(prev => ({
      ...prev,
      cash: Number((prev.cash + proceeds).toFixed(2))
    }));

    addAlert(`Position Closed: Realized P&L of ${rawPnl >= 0 ? '+' : ''}$${rawPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} on ${symbol}`, rawPnl >= 0 ? 'success' : 'info');
  };

  // 4. CANCEL OUTSTANDING LIMIT ORDER
  const handleCancelOrder = (orderId: string) => {
    setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    addAlert('Limit order cancelled successfully.', 'info');
  };

  // 5. PRACTICE ACCOUNT RESET TO INITIAL $50,000 USD
  const handleResetAccount = () => {
    if (window.confirm('Are you sure you want to reset your practice holding portfolio? This deletes transaction records and credits $50,000.00 cash.')) {
      setPortfolio([]);
      setPendingOrders([]);
      setAccount({
        cash: INITIAL_CASH,
        invested: 0,
        totalValue: INITIAL_CASH,
        pnl: 0,
        pnlPercent: 0
      });
      localStorage.removeItem('trading212_portfolio');
      localStorage.removeItem('trading212_pending_orders');
      localStorage.setItem('trading212_cash', INITIAL_CASH.toString());
      addAlert('Virtual practice account restored back to $50,000 USD.', 'info');
    }
  };

  // Filter tickers depending on inputs (search input & asset filters tabs)
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchGroup = activeGroupFilter === 'ALL' || a.group === activeGroupFilter;
      return matchSearch && matchGroup;
    });
  }, [assets, searchQuery, activeGroupFilter]);

  return (
    <div className="min-h-screen bg-[#0b0e11] text-gray-300 font-sans flex flex-col">
      {/* Platform Navigation */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        account={account} 
        resetAccount={handleResetAccount} 
      />

      {/* Dynamic Popups notifications list */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
        {alerts.map(a => (
          <div 
            key={a.id} 
            className={`p-4 rounded-xl shadow-2xl border text-xs font-semibold animate-bounce flex items-start space-x-2 ${
              a.type === 'success' 
                ? 'bg-[#12161c] text-emerald-400 border-white/5' 
                : 'bg-[#12161c] text-brand border-white/5'
            }`}
          >
            <div className={`h-2 w-2 rounded-full mt-1 ${a.type === 'success' ? 'bg-emerald-400' : 'bg-brand'}`} />
            <p>{a.text}</p>
          </div>
        ))}
      </div>

      {/* Main Console Layout grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* SUBVIEW 1: MARKETS (Standard Invest & CFD Leverage) */}
        {(activeTab === 'invest' || activeTab === 'cfd') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Explorer Tickers watch list (Col span 4) */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              <div className="bg-[#12161c] border border-white/5 rounded-2xl p-4 shadow-xl">
                
                {/* Search Panel */}
                <div className="relative mb-3.5">
                  <input
                    id="ticker-search"
                    type="text"
                    placeholder="Search stocks, indexes, crypto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1e2329] border border-white/5 focus:border-brand focus:ring-[#00b0ff]/20 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 text-slate-200 placeholder-gray-500"
                  />
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-500" />
                </div>

                {/* Sub-group horizontal pill filter list */}
                <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-none">
                  {([
                    { label: 'All', value: 'ALL' },
                    { label: 'Stocks', value: 'stocks' },
                    { label: 'ETFs', value: 'etfs' },
                    { label: 'Crypto', value: 'crypto' },
                    { label: 'Forex', value: 'forex' },
                    { label: 'CFDs', value: 'cfds' }
                  ] as { label: string; value: typeof activeGroupFilter }[]).map((tab) => (
                    <button
                      key={tab.label}
                      id={`group-filter-${tab.value}`}
                      onClick={() => setActiveGroupFilter(tab.value)}
                      className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md whitespace-nowrap cursor-pointer transition-all ${
                        activeGroupFilter === tab.value
                          ? 'bg-brand/10 text-brand border border-brand/20'
                          : 'text-gray-400 hover:text-white hover:bg-[#1e2329]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Watchlist tickers Scrollable container */}
              <div id="tickers-watchlist" className="bg-[#12161c] border border-white/5 rounded-2xl shadow-xl overflow-hidden overflow-y-auto max-h-[420px] divide-y divide-white/5">
                <div className="p-4 bg-[#12161c]/40 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#00b0ff]">Live Quotes</span>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Ticks every 4s</span>
                </div>

                {filteredAssets.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-xs">No assets meet filter definitions.</div>
                ) : (
                  filteredAssets.map((stock) => {
                    const isSelected = stock.symbol === selectedAssetSymbol;
                    const isChangeUp = stock.changePercent >= 0;

                    return (
                      <div
                        id={`watchlist-ticker-${stock.symbol}`}
                        key={stock.symbol}
                        onClick={() => setSelectedAssetSymbol(stock.symbol)}
                        className={`p-4 flex items-center justify-between cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-[#1e2329]/40 border-l-4 border-brand' 
                            : 'hover:bg-white/5 border-l-4 border-transparent'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-black text-white text-sm tracking-tight">{stock.symbol}</span>
                            {stock.leverageMultiplier && (
                              <span className="text-[9px] bg-amber-500/10 text-amber-500 font-extrabold px-1 rounded">CFD</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 line-clamp-1">{stock.name}</span>
                        </div>

                        <div className="text-right">
                          <p className="font-mono font-black text-white text-sm tracking-tight">
                            ${stock.price.toLocaleString(undefined, { minimumFractionDigits: stock.price < 10 ? 4 : 2, maximumFractionDigits: stock.price < 10 ? 4 : 2 })}
                          </p>
                          <span className={`inline-flex items-center font-mono font-bold text-[10px] ${
                            isChangeUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isChangeUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Columns: Interactive Chart & Trade Order Panel (Col span 8) */}
            <div className="lg:col-span-8 flex flex-col space-y-6">
              
              {/* Responsive main chart areas */}
              <InteractiveChart asset={activeAsset} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Form */}
                <OrderForm 
                  asset={activeAsset} 
                  account={account} 
                  submitOrder={handleMarketOrLimitOrder} 
                />

                {/* Sub-AI Analytics sidebar nested context details */}
                <AICopilotSidebar 
                  activeAsset={activeAsset} 
                  portfolio={portfolio} 
                  account={account} 
                  assets={assets}
                />
              </div>
            </div>

          </div>
        )}

        {/* SUBVIEW 2: PORTFOLIO & RECAP TRANSACTION LOG */}
        {activeTab === 'portfolio' && (
          <PortfolioOverview 
            positions={portfolio} 
            pendingOrders={pendingOrders} 
            assets={assets} 
            account={account}
            closePosition={handleClosePosition} 
            cancelOrder={handleCancelOrder} 
            onSelectAsset={selectAssetBySymbol}
          />
        )}

        {/* SUBVIEW 3: FINANCIAL RECENT ARTICLES */}
        {activeTab === 'news' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <NewsSection activeAsset={null} onSelectAssetBySymbol={selectAssetBySymbol} />
            </div>
            
            <div className="bg-[#12161c] border border-white/5 rounded-2xl p-6 shadow-xl h-fit text-gray-300 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
                <Sparkles className="h-5 w-5 text-brand" />
                <h4 className="font-extrabold text-sm tracking-wide uppercase">AI Market Digest</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Our embedded Gemini models automatically monitor live portfolio asset weights, open indexes, and ticking prices to generate instant corporate sentiment scoring.
              </p>
              <div className="p-4 bg-[#1e2329]/30 rounded-xl border border-white/5 space-y-3">
                <h5 className="font-extrabold text-xs text-indigo-400 uppercase tracking-widest">Active Holdings Sentiment</h5>
                {portfolio.length === 0 ? (
                  <p className="text-slate-500 text-[10px]">No positions held. Build a watchlist and buy stock assets to compile sentiment scores.</p>
                ) : (
                  <div className="space-y-2">
                    {portfolio.map(p => (
                      <div key={`sentiment_${p.symbol}`} className="flex justify-between items-center text-xs">
                        <span className="font-mono text-slate-300">{p.symbol}</span>
                        <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Bullish</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBVIEW 4: AI CHAT COPILOT ONLY (Full Screen size focus) */}
        {activeTab === 'advisor' && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-4 text-center">
              <Sparkles className="h-8 w-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider">AI Portfolio Consultant</h3>
              <p className="text-xs text-slate-500 mt-1">Converse directly with a wall-street financial advisor about macroeconomic triggers and index balancing.</p>
            </div>
            <AICopilotSidebar 
              activeAsset={activeAsset} 
              portfolio={portfolio} 
              account={account} 
              assets={assets}
            />
          </div>
        )}

      </main>

      {/* Footer warning tag */}
      <footer className="bg-[#12161c] border-t border-white/5 py-6 text-center text-[10px] text-gray-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-2 leading-relaxed">
          <p>
            © 2026 Trading 212 Practice Simulator. All rights reserved. Real-time prices fluctuate in a simulated browser state using dynamic walk models.
          </p>
          <p className="max-w-3xl mx-auto">
            <strong>Leverage Trading Warning:</strong> Contracts for Difference (CFDs) are leveraged financial instruments. Trading CFDs carries high level of risk where gains and losses are amplified. Past simulation values do not dictate actual capital futures.
          </p>
        </div>
      </footer>
    </div>
  );
}
