import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Newspaper, 
  Sparkles, 
  Wallet,
  Coins,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import { AccountState } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  account: AccountState;
  resetAccount: () => void;
}

export default function Navigation({ activeTab, setActiveTab, account, resetAccount }: NavigationProps) {
  const isProfit = account.pnl >= 0;

  return (
    <header className="bg-[#12161c] border-b border-white/5 text-gray-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('invest')}>
            <div className="w-8 h-8 bg-[#00b0ff] rounded flex items-center justify-center font-bold text-black text-lg">
              T
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                TRADING <span className="text-[#00b0ff]">212</span>
              </span>
              <span className="text-[10px] block text-gray-500 font-medium tracking-wider -mt-1 uppercase">
                Practice Simulator
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            <button
              id="nav-tab-invest"
              onClick={() => setActiveTab('invest')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'invest'
                  ? 'bg-[#1e2329] text-white border border-white/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Markets & Invest</span>
            </button>

            <button
              id="nav-tab-cfd"
              onClick={() => setActiveTab('cfd')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'cfd'
                  ? 'bg-[#1e2329] text-amber-500 border border-white/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Coins className="h-4 w-4 text-amber-500" />
              <span>CFD Leverage</span>
            </button>

            <button
              id="nav-tab-portfolio"
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'portfolio'
                  ? 'bg-[#1e2329] text-white border border-white/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>My Portfolio</span>
            </button>

            <button
              id="nav-tab-news"
              onClick={() => setActiveTab('news')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'news'
                  ? 'bg-[#1e2329] text-white border border-white/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Newspaper className="h-4 w-4" />
              <span>Financial News</span>
            </button>

            <button
              id="nav-tab-advisor"
              onClick={() => setActiveTab('advisor')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 relative overflow-hidden ${
                activeTab === 'advisor'
                  ? 'bg-[#1e2329] text-[#00b0ff] border border-white/10'
                  : 'text-[#00b0ff] hover:bg-white/5 hover:text-[#00b0ff]/80'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Core Advisor</span>
              <span className="absolute top-0 right-0 h-1.5 w-1.5 bg-[#00b0ff] rounded-full animate-pulse" />
            </button>
          </nav>

          {/* Practice Funds Panel */}
          <div className="flex items-center space-x-4">
            <div className="bg-[#1e2329] px-4 py-2 rounded-xl border border-white/5 flex items-center space-x-6">
              {/* Portfolio Value */}
              <div>
                <span className="text-[10px] uppercase text-gray-500 font-bold block">Portfolio Value</span>
                <span className="text-sm font-extrabold text-white tracking-tight">
                  ${account.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Free Funds */}
              <div className="hidden sm:block border-l border-white/10 pl-6">
                <span className="text-[10px] uppercase text-gray-500 font-bold block">Free Cash</span>
                <span className="text-sm font-semibold text-gray-300">
                  ${account.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* PnL */}
              <div className="border-l border-white/10 pl-6">
                <span className="text-[10px] uppercase text-gray-500 font-bold block">Return</span>
                <div className={`flex items-center space-x-1 font-bold text-sm ${isProfit ? 'text-[#00c076]' : 'text-[#ff3b30]'}`}>
                  {isProfit ? <TrendingUp className="h-3 w-3 animate-pulse" /> : <TrendingDown className="h-3 w-3 animate-pulse" />}
                  <span>
                    {isProfit ? '+' : ''}
                    {account.pnlPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Reset Practice Money button */}
            <button
              id="reset-practice-account"
              onClick={resetAccount}
              title="Reset Practice Account to $50,000"
              className="p-2 text-gray-500 hover:text-white hover:bg-[#1e2329] rounded-lg transition-colors border border-transparent hover:border-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation tab list */}
      <div className="md:hidden flex overflow-x-auto border-t border-white/5 scrollbar-none px-2 py-1.5 bg-[#12161c] space-x-1">
        <button
          onClick={() => setActiveTab('invest')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activeTab === 'invest' ? 'bg-[#1e2329] text-white' : 'text-gray-400'
          }`}
        >
          Markets
        </button>
        <button
          onClick={() => setActiveTab('cfd')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activeTab === 'cfd' ? 'bg-[#1e2329] text-amber-500 border border-white/10' : 'text-gray-400'
          }`}
        >
          CFD
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activeTab === 'portfolio' ? 'bg-[#1e2329] text-white' : 'text-gray-400'
          }`}
        >
          Portfolio
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activeTab === 'news' ? 'bg-[#1e2329] text-white' : 'text-gray-400'
          }`}
        >
          News
        </button>
        <button
          onClick={() => setActiveTab('advisor')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
            activeTab === 'advisor' ? 'bg-[#1e2329] text-[#00b0ff] border border-white/5' : 'text-gray-400'
          }`}
        >
          AI Advisor
        </button>
      </div>
    </header>
  );
}
