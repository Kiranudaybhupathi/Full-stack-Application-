import React, { useState, useEffect } from 'react';
import { StockAsset, OrderType, OrderSide, AccountState } from '../types';
import { Info, HelpCircle, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface OrderFormProps {
  asset: StockAsset;
  account: AccountState;
  submitOrder: (order: {
    symbol: string;
    type: OrderType;
    side: OrderSide;
    shares: number;
    limitPrice?: number;
  }) => void;
}

export default function OrderForm({ asset, account, submitOrder }: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [orderMode, setOrderMode] = useState<'BUY' | 'SELL'>( 'BUY' ); // For CFDs, BUY is Long, SELL is Short

  // Entry inputs
  const [entryMode, setEntryMode] = useState<'SHARES' | 'VALUE'>('SHARES');
  const [sharesAmount, setSharesAmount] = useState<string>('1');
  const [valueAmount, setValueAmount] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');

  const isCFD = asset.group === 'cfds';
  const leverage = asset.leverageMultiplier || 1;

  // Sync value or shares when user types
  useEffect(() => {
    if (entryMode === 'SHARES') {
      const sh = parseFloat(sharesAmount);
      if (!isNaN(sh) && sh > 0) {
        const val = sh * asset.price;
        setValueAmount(val.toFixed(2));
      } else {
        setValueAmount('');
      }
    }
  }, [sharesAmount, asset.price, entryMode]);

  useEffect(() => {
    if (entryMode === 'VALUE') {
      const val = parseFloat(valueAmount);
      if (!isNaN(val) && val > 0) {
        const sh = val / asset.price;
        setSharesAmount(sh.toFixed(asset.group === 'crypto' ? 6 : 4));
      } else {
        setSharesAmount('');
      }
    }
  }, [valueAmount, asset.price, entryMode]);

  // Handle setting initial limit price
  useEffect(() => {
    if (orderType === 'LIMIT') {
      setLimitPrice(asset.price.toFixed(asset.price < 10 ? 4 : 2));
    }
  }, [orderType, asset.price]);

  // Compute stats
  const numericShares = parseFloat(sharesAmount) || 0;
  const positionValue = numericShares * asset.price;

  // Margin is divided by leverage for CFDs, standard is 100%
  const marginRequired = isCFD ? positionValue / leverage : positionValue;
  const isSufficientFunds = account.cash >= marginRequired;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (numericShares <= 0 || isNaN(numericShares)) {
      alert('Please enter a valid amount.');
      return;
    }

    if (!isSufficientFunds) {
      alert('Insufficient available cash funds to cover this order.');
      return;
    }

    let targetSide: OrderSide = 'BUY';
    if (isCFD) {
      targetSide = orderMode === 'BUY' ? 'BUY' : 'SHORT';
    } else {
      targetSide = orderMode === 'BUY' ? 'BUY' : 'SELL';
    }

    const limitPriceNum = parseFloat(limitPrice);

    submitOrder({
      symbol: asset.symbol,
      type: orderType,
      side: targetSide,
      shares: numericShares,
      limitPrice: orderType === 'LIMIT' && !isNaN(limitPriceNum) ? limitPriceNum : undefined,
    });

    // Reset fields
    setSharesAmount('1');
    setValueAmount(asset.price.toFixed(2));
  };

  return (
    <div className="bg-[#12161c] border border-white/5 rounded-2xl p-6 shadow-xl text-gray-300">
      <h3 className="text-lg font-extrabold text-white tracking-tight mb-4 flex items-center justify-between">
        <span>Place Order</span>
        <span className="text-xs font-mono text-gray-500">{asset.symbol}</span>
      </h3>

      {/* CFD Switch: Buy vs Short */}
      {isCFD ? (
        <div className="grid grid-cols-2 gap-2 bg-[#1e2329] p-1 rounded-xl border border-white/5 mb-4">
          <button
            id="order-mode-buy"
            type="button"
            onClick={() => setOrderMode('BUY')}
            className={`flex items-center justify-center space-x-1 py-2 text-xs font-extrabold rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
              orderMode === 'BUY'
                ? 'bg-[#00c076]/10 text-[#00c076] border border-[#00c076]/20 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Buy CFD (Long)</span>
          </button>
          <button
            id="order-mode-sell"
            type="button"
            onClick={() => setOrderMode('SELL')}
            className={`flex items-center justify-center space-x-1 py-2 text-xs font-extrabold rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
              orderMode === 'SELL'
                ? 'bg-[#ff3b30]/10 text-[#ff3b30] border border-[#ff3b30]/20 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowDownRight className="h-4 w-4" />
            <span>Sell CFD (Short)</span>
          </button>
        </div>
      ) : null}

      {/* Order Type Tabs: Market vs Limit */}
      <div className="grid grid-cols-2 gap-2 bg-[#1e2329] p-1 rounded-xl border border-white/5 mb-4">
        {(['MARKET', 'LIMIT'] as OrderType[]).map((type) => (
          <button
            key={type}
            id={`order-type-${type}`}
            type="button"
            onClick={() => setOrderType(type)}
            className={`py-2 text-xs font-extrabold rounded-lg tracking-wider cursor-pointer transition-all ${
              orderType === type
                ? 'bg-[#12161c] text-white border border-white/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {type} Order
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Entry toggle: shares vs funds amount */}
        <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
          <span>Amount type</span>
          <div className="flex space-x-2">
            <button
              id="entry-mode-shares"
              type="button"
              onClick={() => setEntryMode('SHARES')}
              className={`font-bold transition-colors cursor-pointer ${entryMode === 'SHARES' ? 'text-brand' : 'hover:text-white'}`}
            >
              Shares
            </button>
            <span>•</span>
            <button
              id="entry-mode-value"
              type="button"
              onClick={() => setEntryMode('VALUE')}
              className={`font-bold transition-colors cursor-pointer ${entryMode === 'VALUE' ? 'text-brand' : 'hover:text-white'}`}
            >
              USD ($)
            </button>
          </div>
        </div>

        {/* Dynamic Inputs */}
        {entryMode === 'SHARES' ? (
          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1.5">Shares Quantity</label>
            <div className="relative">
              <input
                id="order-input-shares"
                type="number"
                step="any"
                min="0.0001"
                required
                value={sharesAmount}
                onChange={(e) => setSharesAmount(e.target.value)}
                placeholder="1.0"
                className="w-full bg-[#1e2329] border border-white/5 hover:border-white/10 focus:border-brand rounded-xl px-4 py-3 text-white font-mono font-medium focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <span className="absolute right-4 top-3.5 text-xs text-gray-500 uppercase font-bold select-none">SHARES</span>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1.5">Target Funding Cash</label>
            <div className="relative">
              <input
                id="order-input-value"
                type="number"
                step="any"
                min="1"
                required
                value={valueAmount}
                onChange={(e) => setValueAmount(e.target.value)}
                placeholder="100.00"
                className="w-full bg-[#1e2329] border border-white/5 hover:border-white/10 focus:border-brand rounded-xl pl-8 pr-4 py-3 text-white font-mono font-medium focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <span className="absolute left-4 top-3.5 text-gray-500 select-none">
                <DollarSign className="h-3.5 w-3.5" />
              </span>
              <span className="absolute right-4 top-3.5 text-xs text-gray-500 uppercase font-bold select-none">USD</span>
            </div>
          </div>
        )}

        {/* Limit Target Price */}
        {orderType === 'LIMIT' ? (
          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-black tracking-wider mb-1.5">Limit Price Target</label>
            <div className="relative">
              <input
                id="order-input-limit"
                type="number"
                step="any"
                min="0.0001"
                required
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={asset.price.toFixed(2)}
                className="w-full bg-[#1e2329] border border-white/5 hover:border-white/10 focus:border-brand rounded-xl pl-8 pr-4 py-3 text-white font-mono font-medium focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <span className="absolute left-4 top-3.5 text-gray-500 select-none">
                <DollarSign className="h-3.5 w-3.5" />
              </span>
              <span className="absolute right-4 top-3.5 text-xs text-gray-500 uppercase font-bold select-none">LIMIT</span>
            </div>
          </div>
        ) : null}

        {/* Financial Recap details */}
        <div className="bg-[#1e2329]/30 rounded-xl border border-white/5 p-4 space-y-2.5 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Market Price</span>
            <span className="font-mono text-white">${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2 })}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Calculated Shares</span>
            <span className="font-mono text-white">
              {numericShares.toLocaleString(undefined, { maximumFractionDigits: 6 })} shares
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Total Position Value</span>
            <span className="font-mono text-white">${positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="border-t border-white/5 my-2 pt-2 flex justify-between items-center text-xs">
            <span className="font-bold text-gray-300">Cash Required</span>
            <span className={`font-mono font-black ${isSufficientFunds ? 'text-brand' : 'text-[#ff3b30]'}`}>
              ${marginRequired.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Error Flag */}
        {!isSufficientFunds && (
          <div className="flex items-start space-x-2 bg-[#ff3b30]/15 border border-[#ff3b30]/20 rounded-xl p-3 text-[#ff3b30] text-xs">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p><strong>Insufficient Balance</strong>: This position requires extra cash. Clear active orders or consider reducing shares quantity.</p>
          </div>
        )}

        {/* CFD Risk warning */}
        {isCFD ? (
          <div className="bg-amber-500/10 border border-amber-500/10 rounded-xl p-3 text-amber-500 text-xs flex items-start space-x-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p><strong>Leverage Notice:</strong> This CFD leverages profits & losses with a <strong>{leverage}X multiplier</strong>. Sudden market movements can amplify capital fluctuations.</p>
          </div>
        ) : null}

        {/* Submit */}
        <button
          id="order-submit-button"
          type="submit"
          disabled={!isSufficientFunds || numericShares <= 0}
          className={`w-full py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-widest cursor-pointer transition-all ${
            !isSufficientFunds || numericShares <= 0
              ? 'bg-[#1e2329] text-gray-600 border border-white/5 cursor-not-allowed'
              : orderMode === 'BUY'
                ? 'bg-[#00c076] hover:bg-[#00a86b] text-white border border-transparent font-bold active:translate-y-px'
                : 'bg-[#ff3b30] hover:bg-[#e03126] text-white border border-transparent font-bold active:translate-y-px'
          }`}
        >
          {orderType === 'MARKET' ? (
            <span>Execute {orderMode === 'BUY' ? 'Buy' : 'Short'} Market Order</span>
          ) : (
            <span>Place {orderMode === 'BUY' ? 'Buy' : 'Short'} Limit Order</span>
          )}
        </button>
      </form>
    </div>
  );
}
