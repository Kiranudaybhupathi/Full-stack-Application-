import React, { useState, useEffect } from 'react';
import { FinancialNewsItem, StockAsset } from '../types';
import { Newspaper, Loader2, ArrowUpRight, MessageSquare, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';

interface NewsSectionProps {
  activeAsset: StockAsset | null;
  onSelectAssetBySymbol: (symbol: string) => void;
}

export default function NewsSection({ activeAsset, onSelectAssetBySymbol }: NewsSectionProps) {
  const [news, setNews] = useState<FinancialNewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const symbol = activeAsset ? activeAsset.symbol : undefined;
        const name = activeAsset ? activeAsset.name : undefined;

        const response = await fetch('/api/gemini/news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, name })
        });
        
        if (!response.ok) {
          throw new Error('Failed to retrieve news from fullstack backend');
        }

        const data = await response.json();
        if (data && data.news) {
          setNews(data.news);
        }
      } catch (err) {
        console.error('Failed to loading news', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [activeAsset, refreshKey]);

  return (
    <div className="bg-[#12161c] border border-white/5 rounded-2xl shadow-xl p-6 text-gray-300 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <Newspaper className="h-5 w-5 text-brand" />
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-white">
              {activeAsset ? `${activeAsset.name} Insights` : 'Global Market Intelligence'}
            </h3>
            <p className="text-xs text-gray-500 font-medium tracking-wide">
              {activeAsset ? `AI articles custom curated for ${activeAsset.symbol}` : 'Real-time AI curated business journalism'}
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          id="refresh-news-button"
          onClick={() => setRefreshKey(prev => prev + 1)}
          disabled={loading}
          className="p-2 border border-white/5 rounded-lg hover:bg-white/5 transition-all text-gray-400 hover:text-white flex items-center space-x-1 uppercase text-[10px] tracking-wider cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 text-brand animate-spin" />
          <p className="text-xs font-semibold">Tuning into global financial channels...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-xs text-[#94a3b8]">No active news feeds found. Try refreshing in a moment.</div>
      ) : (
        <div className="space-y-4">
          {news.map((item) => {
            const isPos = item.sentiment === 'positive';
            const isNeg = item.sentiment === 'negative';

            return (
              <div 
                key={item.id} 
                className="bg-[#1e2329]/30 p-4 border border-white/5 rounded-xl hover:border-white/10 transition-all text-left flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between space-x-4 mb-2">
                  <span className="text-[10px] text-brand uppercase font-black font-mono tracking-wider">
                    {item.source} • <span className="text-gray-500">{item.timeString}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    isPos ? 'bg-emerald-500/10 text-[#00c076]' :
                    isNeg ? 'bg-rose-500/10 text-[#ff3b30]' : 'bg-[#1e2329] text-gray-400'
                  }`}>
                    {item.sentiment}
                  </span>
                </div>

                <h4 className="font-extrabold text-white group-hover:text-brand transition-colors text-sm leading-snug">
                  {item.title}
                </h4>

                <p className="text-xs text-gray-400 leading-relaxed mt-2.5 font-sans">
                  {item.summary}
                </p>

                {/* If the news points to a stock symbols */}
                {item.symbol && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <button
                      id={`news-target-${item.symbol}`}
                      onClick={() => onSelectAssetBySymbol(item.symbol!)}
                      className="cursor-pointer inline-flex items-center space-x-1.5 text-[10px] tracking-wide text-brand font-extrabold hover:text-brand-hover transition-colors bg-[#12161c] border border-white/5 px-2.5 py-1 rounded"
                    >
                      <span>Analyze {item.symbol}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                    
                    <div className="flex items-center space-x-3 text-gray-500 text-[10px] font-sans">
                      <span className="flex items-center space-x-1">
                        <ThumbsUp className="h-3 w-3 text-gray-650" />
                        <span>Liked</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
