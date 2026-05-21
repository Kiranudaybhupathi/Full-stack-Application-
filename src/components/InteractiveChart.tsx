import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { StockAsset, PriceHistoryPoint } from '../types';
import { TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';

interface InteractiveChartProps {
  asset: StockAsset;
}

type TimeFrame = '1D' | '1W' | '1M' | '3M' | '1Y';

export default function InteractiveChart({ asset }: InteractiveChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1D');

  // Retrieve correct points for the timeframe
  const data = useMemo(() => {
    return asset.history[timeFrame] || [];
  }, [asset, timeFrame]);

  // Determine if overall change in current timeframe is positive or negative
  const trendMetrics = useMemo(() => {
    if (data.length < 2) return { isUp: true, pctChange: 0, amtChange: 0 };
    const firstPrice = data[0].price;
    const lastPrice = data[data.length - 1].price;
    const amtChange = lastPrice - firstPrice;
    const pctChange = (amtChange / firstPrice) * 100;
    return {
      isUp: amtChange >= 0,
      pctChange: Number(pctChange.toFixed(2)),
      amtChange: Number(amtChange.toFixed(asset.price < 10 ? 4 : 2))
    };
  }, [data, asset.price]);

  // Color mappings
  const strokeColor = trendMetrics.isUp ? '#10b981' : '#f43f5e'; // emerald vs rose
  const gradientId = `chartGradient_${asset.symbol}_${timeFrame}`;

  return (
    <div className="bg-[#12161c] border border-white/5 rounded-2xl p-6 shadow-xl text-gray-300">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-[#1e2329] text-gray-400 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wide">
              {asset.group}
            </span>
            {asset.leverageMultiplier && (
              <span className="text-xs bg-amber-500/10 text-amber-500 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wide border border-amber-500/10">
                {asset.leverageMultiplier}X Margin
              </span>
            )}
            <span className="text-xs text-gray-500 font-mono">
              {asset.symbol}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            {asset.name}
          </h2>

          <div className="flex items-baseline mt-2 space-x-3">
            <span className="text-3xl font-black font-mono tracking-tighter text-white">
              ${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2, maximumFractionDigits: asset.price < 10 ? 4 : 2 })}
            </span>
            <span className={`inline-flex items-center text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
              trendMetrics.isUp ? 'bg-emerald-500/10 text-[#00c076]' : 'bg-rose-500/10 text-[#ff3b30]'
            }`}>
              {trendMetrics.isUp ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
              {trendMetrics.isUp ? '+' : ''}{trendMetrics.pctChange}%
            </span>
            <span className="text-xs text-gray-500 font-medium">
              over this interval ({timeFrame})
            </span>
          </div>
        </div>

        {/* Timeframe Selectors */}
        <div className="flex bg-[#1e2329] p-1 rounded-xl border border-white/5 mt-4 sm:mt-0 self-start">
          {(['1D', '1W', '1M', '3M', '1Y'] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              id={`timeframe-btn-${tf}`}
              onClick={() => setTimeFrame(tf)}
              className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg tracking-wider transition-all cursor-pointer ${
                timeFrame === tf
                  ? 'bg-[#12161c] text-white border border-white/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-[280px] w-full" id="stock-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.00} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="#475569" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#475569" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              orientation="right"
              dx={10}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as PriceHistoryPoint;
                  return (
                    <div className="bg-[#1e2329] border border-white/5 rounded-xl p-3 shadow-2xl text-white font-mono text-xs">
                      <p className="text-gray-500 font-sans mb-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {pt.time}
                      </p>
                      <p className="font-extrabold text-white text-sm">
                        Price: ${pt.price.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2, maximumFractionDigits: asset.price < 10 ? 4 : 2 })}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Ratios Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5 text-gray-400 text-xs">
        <div className="bg-[#1e2329]/40 p-3 rounded-xl border border-white/5">
          <p className="text-gray-500 font-semibold uppercase tracking-wider text-[10px] mb-1">Open Price</p>
          <p className="font-mono text-sm font-extrabold text-slate-200">
            ${asset.openPrice.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2 })}
          </p>
        </div>
        <div className="bg-[#1e2329]/40 p-3 rounded-xl border border-white/5">
          <p className="text-gray-500 font-semibold uppercase tracking-wider text-[10px] mb-1">24h High / Low</p>
          <p className="font-mono text-sm font-extrabold text-[#94a3b8]">
            ${asset.high24h.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2 })} / ${asset.low24h.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2 })}
          </p>
        </div>
        <div className="bg-[#1e2329]/40 p-3 rounded-xl border border-white/5">
          <p className="text-gray-500 font-semibold uppercase tracking-wider text-[10px] mb-1">Market Cap</p>
          <p className="font-mono text-sm font-extrabold text-slate-200">
            {asset.marketCap}
          </p>
        </div>
        <div className="bg-[#1e2329]/40 p-3 rounded-xl border border-white/5">
          <p className="text-gray-500 font-semibold uppercase tracking-wider text-[10px] mb-1">P/E Ratio / Dividend Yield</p>
          <p className="font-mono text-sm font-extrabold text-slate-200">
            {asset.peRatio} / {asset.divYield}
          </p>
        </div>
      </div>
    </div>
  );
}
