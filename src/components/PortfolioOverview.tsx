import React from 'react';
import { PortfolioPosition, Order, StockAsset, AccountState } from '../types';
import { TrendingUp, TrendingDown, X, Clock, HelpCircle, Briefcase, ChevronRight, Ban } from 'lucide-react';

interface PortfolioOverviewProps {
  positions: PortfolioPosition[];
  pendingOrders: Order[];
  assets: StockAsset[];
  account: AccountState;
  closePosition: (symbol: string) => void;
  cancelOrder: (orderId: string) => void;
  onSelectAsset: (symbol: string) => void;
}

export default function PortfolioOverview({
  positions,
  pendingOrders,
  assets,
  account,
  closePosition,
  cancelOrder,
  onSelectAsset
}: PortfolioOverviewProps) {
  
  const getAssetInfo = (symbol: string): StockAsset | undefined => {
    return assets.find(a => a.symbol === symbol);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Holdings Section */}
      <div className="bg-[#12161c] border border-white/5 rounded-2xl shadow-xl overflow-hidden text-gray-300">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#12161c]/55">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-brand" />
            <h3 className="text-lg font-extrabold tracking-tight">Active Holdings</h3>
          </div>
          <span className="text-xs font-mono text-gray-500 bg-[#1e2329] px-2.5 py-1 rounded-md">
            {positions.length} Positions Active
          </span>
        </div>

        {positions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <HelpCircle className="h-12 w-12 mx-auto text-slate-755 mb-4 animate-pulse2" />
            <p className="font-extrabold text-sm text-slate-400 mb-1">Your Portfolio is Empty</p>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">Navigate to Markets & Invest or CFD Leverage, pick any asset, and execute a practice order to start investing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] text-gray-500 font-extrabold uppercase tracking-widest bg-[#1e2329]/30">
                  <th className="py-4 px-6">Asset</th>
                  <th className="py-4 px-3">Position</th>
                  <th className="py-4 px-3 text-right">Avg Buy Price</th>
                  <th className="py-4 px-3 text-right">Current Price</th>
                  <th className="py-4 px-3 text-right">Total Invested</th>
                  <th className="py-4 px-3 text-right">Current Value</th>
                  <th className="py-4 px-3 text-right">Returns</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-mono">
                {positions.map((pos) => {
                  const asset = getAssetInfo(pos.symbol);
                  if (!asset) return null;

                  const currentPrice = asset.price;
                  const isShort = !!pos.isShort;
                  const leverage = pos.leverageMultiplier || 1;

                  // CFD shorts gain when price falls, long positions gain when price rises
                  const priceDiff = currentPrice - pos.averageBuyPrice;
                  const directionalDiff = isShort ? -priceDiff : priceDiff;
                  
                  // Leveraged returns
                  const rawPnl = pos.shares * directionalDiff * leverage;
                  const value = pos.investedAmount + rawPnl;
                  const pnl = rawPnl;

                  const pnlPercent = (pnl / pos.investedAmount) * 100;
                  const isProfit = pnl >= 0;

                  return (
                    <tr 
                      key={`${pos.symbol}_position`} 
                      className="hover:bg-white/5 group transition-colors"
                    >
                      {/* Asset */}
                      <td className="py-4 px-6 font-sans">
                        <div 
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() => onSelectAsset(pos.symbol)}
                        >
                          <div className={`p-2 rounded-lg text-xs font-black select-none ${
                            asset.group === 'crypto' ? 'bg-indigo-500/10 text-indigo-400' :
                            asset.group === 'cfds' ? 'bg-amber-500/10 text-amber-500' :
                            asset.group === 'forex' ? 'bg-blue-500/10 text-blue-400' : 'bg-[#1e2329] text-gray-300'
                          }`}>
                            {asset.symbol}
                          </div>
                          <div>
                            <span className="font-extrabold text-white block group-hover:text-brand transition-colors">
                              {asset.name}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase font-semibold">
                              {asset.group} {isShort ? '• SHORT' : ''} {leverage > 1 ? `• ${leverage}x` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Position Shares */}
                      <td className="py-4 px-3 font-medium text-gray-300">
                        {pos.shares.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        <span className="text-[10px] text-gray-500 block">Shares Held</span>
                      </td>

                      {/* Avg Buy */}
                      <td className="py-4 px-3 text-right text-gray-300 font-medium">
                        ${pos.averageBuyPrice.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2, maximumFractionDigits: asset.price < 10 ? 4 : 2 })}
                      </td>

                      {/* Current price */}
                      <td className="py-4 px-3 text-right text-white font-extrabold">
                        ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2, maximumFractionDigits: asset.price < 10 ? 4 : 2 })}
                      </td>

                      {/* Invested */}
                      <td className="py-4 px-3 text-right text-gray-400">
                        ${pos.investedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Value */}
                      <td className="py-4 px-3 text-right text-gray-200 font-bold">
                        ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Returns */}
                      <td className={`py-4 px-3 text-right ${isProfit ? 'text-[#00c076]' : 'text-[#ff3b30]'} font-extrabold`}>
                        <div>{isProfit ? '+' : ''}{pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-[10px] uppercase font-bold">
                          {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                        </div>
                      </td>

                      {/* Close Position action */}
                      <td className="py-4 px-6 text-center">
                        <button
                          id={`close-btn-${pos.symbol}`}
                          onClick={() => closePosition(pos.symbol)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold tracking-wide uppercase transition-all border border-[#ff3b30]/20 bg-[#ff3b30]/5 text-[#ff3b30] hover:bg-[#ff3b30] hover:text-white cursor-pointer"
                        >
                          Close Position
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Limit Orders Section */}
      <div className="bg-[#12161c] border border-white/5 rounded-2xl shadow-xl overflow-hidden text-gray-300">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#12161c]/55">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-extrabold tracking-tight">Pending Orders log</h3>
          </div>
          <span className="text-xs font-mono text-gray-500 bg-[#1e2329] px-2.5 py-1 rounded-md">
            {pendingOrders.length} Limit Orders Pending
          </span>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 font-sans text-xs">
            <p>No pending trigger limit orders on book.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-[#1e2329]/30">
                  <th className="py-3 px-6">Asset</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Shares</th>
                  <th className="py-3 px-3 text-right">Core Price Target</th>
                  <th className="py-3 px-3 text-right">Value</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-6 text-center">Cancel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-mono text-gray-300">
                {pendingOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-white/5">
                    <td className="py-3 px-6 font-sans font-bold">
                      <div className="flex items-center space-x-2">
                        <span className="text-white">{ord.name}</span>
                        <span className="text-[10px] text-gray-500 font-semibold shadow-sm bg-[#1e2329] px-1 rounded">[{ord.symbol}]</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-black ${
                        ord.side === 'BUY' ? 'bg-[#00c076]/10 text-[#00c076]' : 'bg-[#ff3b30]/10 text-[#ff3b30]'
                      }`}>
                        LIMIT {ord.side}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {ord.shares.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-white font-extrabold">
                      ${ord.limitPrice?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-400">
                      ${(ord.shares * (ord.limitPrice || ord.price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500 font-sans">
                      {new Date(ord.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <button
                        id={`cancel-order-${ord.id}`}
                        onClick={() => cancelOrder(ord.id)}
                        title="Cancel Pending Limit Order"
                        className="p-1 px-2 hover:bg-[#ff3b30]/15 border border-transparent hover:border-[#ff3b30]/20 text-gray-500 hover:text-[#ff3b30] transition-all rounded-lg cursor-pointer flex items-center justify-center space-x-1 mx-auto text-xs font-bold"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span>Cancel</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
