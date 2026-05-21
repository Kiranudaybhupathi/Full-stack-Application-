import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, StockAsset, PortfolioPosition, AccountState } from '../types';
import { Sparkles, Send, Loader2, HelpCircle, FileText, ArrowUpRight, TrendingUp } from 'lucide-react';

interface AICopilotSidebarProps {
  activeAsset: StockAsset | null;
  portfolio: PortfolioPosition[];
  account: AccountState;
  assets: StockAsset[];
}

type CopilotMode = 'ANALYSIS' | 'CHAT';

export default function AICopilotSidebar({ activeAsset, portfolio, account, assets }: AICopilotSidebarProps) {
  const [activeMode, setActiveMode] = useState<CopilotMode>('ANALYSIS');
  
  // Research Brief State
  const [analysisText, setAnalysisText] = useState<string>('');
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [analysisSymbol, setAnalysisSymbol] = useState<string | null>(null);

  // Chat Advisor State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your AI financial copilot. I have full context on your portfolio, active investments, and cash balances. Ask me anything, or let me evaluate your portfolio concentration!",
      timestamp: new Date().toISOString()
    }
  ]);
  const [textInput, setTextInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch CFA briefing when activeAsset changes
  useEffect(() => {
    if (!activeAsset) {
      setAnalysisText('Select any market asset to extract deep AI analysis reports.');
      return;
    }

    // Prevent duplicating identical symbol fetches
    if (activeMode === 'ANALYSIS' && analysisSymbol === activeAsset.symbol) return;

    const fetchBrief = async () => {
      setAnalysisLoading(true);
      try {
        const response = await fetch('/api/gemini/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: activeAsset.symbol,
            name: activeAsset.name,
            price: activeAsset.price
          })
        });

        if (!response.ok) throw new Error('CFA route load issue');
        const data = await response.json();
        if (data && data.analysis) {
          setAnalysisText(data.analysis);
          setAnalysisSymbol(activeAsset.symbol);
        }
      } catch (err) {
        setAnalysisText('Error syncing research brief. Try activating GEMINI_API_KEY in secrets.');
      } finally {
        setAnalysisLoading(false);
      }
    };

    fetchBrief();
  }, [activeAsset, activeMode, analysisSymbol]);

  // Handle activeMode shifts
  const shiftMode = (mode: CopilotMode) => {
    setActiveMode(mode);
  };

  // Submit chat inquiries
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || chatLoading) return;

    const userInquiry = textInput.trim();
    setTextInput('');

    // Append user message local thread
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userInquiry,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const payloadMessages = [...chatMessages, userMsg].map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          portfolio: portfolio,
          cash: account.cash,
          assets: assets
        })
      });

      if (!response.ok) throw new Error('Advisor response fail');
      const data = await response.json();

      if (data && data.response) {
        setChatMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: data.response,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, {
        id: `ai_err_${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I am facing an API connectivity issue. Please verify processes and GEMINI_API_KEY credentials.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper to cleanly render markdown paragraphs simple split
  const renderMarkdown = (text: string) => {
    return text.split('\n\n').map((para, i) => {
      // Check for headings
      if (para.startsWith('###')) {
        return <h4 key={i} className="text-sm font-black text-brand mt-4 mb-2 uppercase tracking-wide">{para.replace('###', '').trim()}</h4>;
      }
      if (para.startsWith('####')) {
        return <h5 key={i} className="text-xs font-black text-amber-500 mt-4 mb-2 uppercase tracking-wide">{para.replace('####', '').trim()}</h5>;
      }
      if (para.startsWith('**') || para.startsWith('*')) {
        // Simple bold replacements inside para
        const cleanPara = para.replace(/\*\*/g, '');
        return <p key={i} className="text-xs text-slate-300 leading-relaxed font-sans mt-2">{cleanPara}</p>;
      }
      return <p key={i} className="text-xs text-slate-300 leading-relaxed font-sans mt-2">{para}</p>;
    });
  };

  return (
    <div className="bg-[#12161c] border border-white/5 rounded-2xl shadow-xl flex flex-col h-[520px] overflow-hidden text-gray-300">
      {/* Tab Selectors */}
      <div className="flex border-b border-white/5 bg-[#12161c]/60 p-1">
        <button
          id="copilot-tab-analysis"
          onClick={() => shiftMode('ANALYSIS')}
          className={`flex-1 py-3 text-xs font-extrabold tracking-wider uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeMode === 'ANALYSIS'
              ? 'text-brand border-b-2 border-brand font-black'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Research Brief</span>
        </button>

        <button
          id="copilot-tab-chat"
          onClick={() => shiftMode('CHAT')}
          className={`flex-1 py-3 text-xs font-extrabold tracking-wider uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeMode === 'CHAT'
              ? 'text-brand border-b-2 border-brand font-black'
              : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Analyst Copilot</span>
        </button>
      </div>

      {/* Content panel */}
      <div className="flex-1 p-5 overflow-y-auto min-h-0 bg-[#1e2329]/10">
        
        {/* VIEW 1: CFA Analysis brief */}
        {activeMode === 'ANALYSIS' ? (
          <div className="space-y-4">
            {activeAsset ? (
              <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
                <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono uppercase tracking-wider">{activeAsset.symbol}</span>
                <span className="text-xs text-gray-400 font-semibold">{activeAsset.name} Report</span>
              </div>
            ) : null}

            {analysisLoading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-8 w-8 text-brand animate-spin" />
                <p className="text-xs text-gray-500 font-medium">CFA Analysts crafting custom investment brief...</p>
              </div>
            ) : (
              <div className="prose prose-invert text-xs max-w-none bullet-custom">
                {renderMarkdown(analysisText)}
              </div>
            )}
          </div>
        ) : (
          
          /* VIEW 2: Chat advisor */
          <div className="flex flex-col h-full space-y-4 justify-between">
            {/* Messages box */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {chatMessages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs text-left leading-relaxed ${
                      isAI 
                        ? 'bg-[#1e2329] border border-white/5 text-gray-100 rounded-tl-none font-sans' 
                        : 'bg-brand text-black font-semibold rounded-tr-none font-sans'
                    }`}>
                      {/* For AI answer, support line break lists */}
                      {isAI ? (
                        <div className="space-y-1.5 whitespace-pre-line">
                          {msg.text}
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-500 font-sans mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              
              {chatLoading && (
                <div className="flex items-center space-x-2 text-gray-400 bg-[#1e2329] border border-white/5 rounded-2xl p-3.5 text-xs font-sans self-start w-3/4">
                  <Loader2 className="h-3.5 w-3.5 text-brand animate-spin shrink-0" />
                  <span>CFA Analyst compiling portfolio weights and macro inputs...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendChatMessage} className="flex space-x-2 pt-2 border-t border-white/5">
              <input
                id="copilot-input-field"
                type="text"
                disabled={chatLoading}
                required
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ask e.g. 'Is Tesla standard over-concentrated?'"
                className="flex-1 bg-[#1e2329] border border-white/5 hover:border-white/10 focus:border-brand rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button
                id="copilot-send-button"
                type="submit"
                disabled={chatLoading}
                className="p-2.5 rounded-xl bg-brand hover:bg-[#009be0] text-black transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
