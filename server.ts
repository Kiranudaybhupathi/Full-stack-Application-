import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client securely following system skill rules
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log('Secure server-side Gemini Client initialized successfully.');
} else {
  console.warn('GEMINI_API_KEY is not defined. AI financial features will fall back to smart simulated responses.');
}

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

/**
 * Endpoint for the AI Financial Copilot / Advisor Chat.
 * Direct integration with user holdings to make feedback hyper-realistic.
 */
app.post('/api/gemini/advisor', async (req, res) => {
  const { messages, portfolio, cash, assets } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid or missing messages list.' });
  }

  // Get user question (last message)
  const userMessage = messages[messages.length - 1];
  const question = userMessage ? userMessage.text : 'Suggest some stocks to invest in based on my profile';

  // Construct structured grounding model context with user portfolio
  const portfolioSummary = portfolio && portfolio.length > 0 
    ? portfolio.map((p: any) => {
        const assetInfo = assets ? assets.find((a: any) => a.symbol === p.symbol) : null;
        const currentPrice = assetInfo ? assetInfo.price : p.averageBuyPrice;
        const value = p.shares * currentPrice;
        const pnl = (currentPrice - p.averageBuyPrice) * p.shares * (p.isShort ? -1 : 1);
        return `- ${p.shares} shares of ${p.symbol} (${p.isShort ? 'SHORT' : 'BUY'}) bought at $${p.averageBuyPrice.toFixed(2)} (Current value: $${value.toFixed(2)}, Gain/Loss: $${pnl.toFixed(2)})`;
      }).join('\n')
    : 'No active portfolio investments yet';

  const systemInstruction = `You are a professional, senior Wall Street Financial Analyst and Portfolio Advisor embedded in a Trading 212 application.
Your goal is to provide insightful, accurate, and balanced investing viewpoints.
Be objective, polite, clear, and informative. Always add standard educational disclaimers reminding users that virtual trading is for practice and leveraged CFDs carry capital risk.

User's Practice Account context:
- Free Cash Available: $${(cash || 50000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
- Active Holdings inside Portfolio:
${portfolioSummary}

Use actual financial metrics if referring to assets. Be encouraging and provide structured bullet points. Keep responses highly informative but concise. Avoid general fluff. Do NOT formulate long introductory lines; dive directly into financial calculations or tactical portfolio diversification concepts.`;

  try {
    if (ai) {
      // Use the standard model 'gemini-3.5-flash' for basic text tasks
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: question,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
      
      return res.json({ response: response.text });
    } else {
      // Fallback response with beautiful finance formulas
      return res.json({
        response: `**[SIMULATED ANALYST REVIEW]**
Your portfolio currently holds **${portfolio && portfolio.length > 0 ? portfolio.length : 'no'} active positions**. 
Based on standard asset pricing models and portfolio diversification theories:
1. **Cash Cushion**: You have $${(cash || 50000).toLocaleString()} free cash. This liquidity allows you to buy dollar-cost averaging dips.
2. **Diversification Guideline**: Ensure no more than 10-15% is concentrated in a single sector (e.g., highly volatile CFDs or cryptocurrencies) to minimize unsystematic risk.
3. **Recommendation**: Start a regular investment plan in high-quality indexes or ETFs like the S&P 500 (VOO) or Nasdaq-100 (QQQ) to form a robust foundation.

*(Configure your standard GEMINI_API_KEY in the Secrets panel to activate live AI answers)*`
      });
    }
  } catch (error: any) {
    console.error('Gemini Advisor Error:', error);
    res.status(500).json({ error: error.message || 'Error running server-side advisor query.' });
  }
});

/**
 * Endpoint to generate specific custom news items depending on selected symbol
 * or general global stock highlights.
 */
app.post('/api/gemini/news', async (req, res) => {
  const { symbol, name } = req.body;

  const targetSymbol = symbol || 'Global Markets';
  const targetName = name || 'US and Global Financial Indexes';

  const systemPrompt = `Generate a realistic financial news article snippet for a stock trading platform.
Target Stock Asset: ${targetSymbol} (${targetName})
The article should feel immediate, highly informative, and contain references to real recent events or logical sector movements (such as AI trends for Nvidia/Microsoft, EV growth for Tesla, inflation for Gold, or interest rate decisions).

Response Schema MUST strictly match a JSON representation of 3 news items:
Schema fields:
- id: random string
- title: string (professional, snappy headline)
- summary: string (2-3 sentences explaining market dynamics or business announcements)
- source: string (e.g. "Bloomberg", "Reuters", "Financial Times")
- timeString: string (e.g. "12m ago", "2h ago", "1d ago")
- sentiment: 'positive' | 'negative' | 'neutral'
- symbol: "${targetSymbol}"`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Create financial news for ${targetSymbol}.`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                source: { type: Type.STRING },
                timeString: { type: Type.STRING },
                sentiment: { type: Type.STRING },
                symbol: { type: Type.STRING },
              },
              required: ['id', 'title', 'summary', 'source', 'timeString', 'sentiment', 'symbol']
            }
          }
        }
      });

      const parsedNews = JSON.parse(response.text || '[]');
      return res.json({ news: parsedNews });
    } else {
      // Fallback news generator
      const fallbackNews = [
        {
          id: `news_fb_${Date.now()}_1`,
          title: `${targetSymbol} Momentum Continues Amid Strong Institutional Upgrades`,
          summary: `Analyst upgrades on ${targetName} highlight robust operating model efficiencies and pricing power. Traders expect technical resistance levels to be tested in the upcoming session.`,
          source: 'MarketWatch',
          timeString: '15m ago',
          sentiment: 'positive',
          symbol: targetSymbol
        },
        {
          id: `news_fb_${Date.now()}_2`,
          title: `Macro Headwinds and Inflation Indicators Impose Sector Squeeze`,
          summary: `Global indexes see slight volatility as Treasury curve shifts increase cost of capital queries. ${targetSymbol} trading volumes surge as retail investors buy the corrective consolidations.`,
          source: 'Reuters',
          timeString: '1h ago',
          sentiment: 'neutral',
          symbol: targetSymbol
        },
        {
          id: `news_fb_${Date.now()}_3`,
          title: `What Options Flows Tell Us About the Short-term Future of ${targetSymbol}`,
          summary: `Derivative contract volumes for ${targetSymbol} imply a protective hedge formation. Implied volatility remains slightly higher than historical averages ahead of the upcoming core CPU releases.`,
          source: 'Financial Times',
          timeString: '5h ago',
          sentiment: 'neutral',
          symbol: targetSymbol
        }
      ];
      return res.json({ news: fallbackNews });
    }
  } catch (error: any) {
    console.error('Gemini News Error:', error);
    res.status(500).json({ error: error.message || 'Error generating server-side stock news.' });
  }
});

/**
 * Endpoint to generate a detailed analyst research report for a specific stock asset.
 */
app.post('/api/gemini/analysis', async (req, res) => {
  const { symbol, name, price } = req.body;

  if (!symbol || !name) {
    return res.status(400).json({ error: 'Missing stock symbol or name parameter.' });
  }

  const promptText = `Review the asset ${name} (${symbol}), trading at the simulated price of $${price}. Provide a structured investment report.`;
  const systemPrompt = `You are a certified CFA Charterholder conducting an investment analysis.
Return a beautiful, professional, structured investor brief about ${name} (${symbol}).
Address:
1. **Investment Thesis**: (Why investors flock to or hold this asset)
2. **Key Financial Catalyst**: (What product, service, or policy will spark the next 10% movement)
3. **Core Buying Risks**: (Competitive threats, margins, multiples, or systemic liabilities)
4. **CFD & Leverage Trading Strategy**: This is an educational walkthrough. Explain how trading a leveraged instrument (e.g. 5x) for this stock amplifies volatility, requiring strict stop-losses or margin calculations.

Use clear headings and markdown notation. Write in an authoritative, insightful tone. Keep the output to around 3 or 4 short paragraphs total.`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });
      return res.json({ analysis: response.text });
    } else {
      // Fallback CFA briefing
      const fallbackBrief = `### CFA Investor Brief: ${symbol} (${name})

#### 1. Investment Thesis
${name} remains a dominant market force within its segment. Capital allocation is supported by a robust balance sheet and immense pricing flexibility. Long-term compounding flows are bolstered by continuous software integrations and strong consumer retention loops that insulate market share.

#### 2. Key Catalyst
An upcoming platform update relating to automated operational efficiencies is expected to drive operating margin expansion. Expanding enterprise partnerships should drive secondary recurring revenue streams, expanding enterprise values.

#### 3. Core Concerns & Volatility
High relative valuation multiples (e.g. forward P/E expansion) mean high sensitivity to any quarterly revenue misses. Supply logistics and cross-border currency translation variations represent immediate margin headwinds.

#### 4. CFD Risk Education
Because ${symbol} has high intraday high/low swings, utilizing a 5x or 10x leverage product translates to substantial margin multipliers. A 2% sudden downside movement results in a **10% to 20% capital loss** for long CFD positions. Maintain protective stop targets and manage leverage prudently.

*(Enable your GEMINI_API_KEY in secrets to fetch fully-customized investor intelligence reports)*`;
      return res.json({ analysis: fallbackBrief });
    }
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    res.status(500).json({ error: error.message || 'Error retrieving analytical investor guidelines.' });
  }
});

// ----------------------------------------------------
// VITE AND STATIC ASSETS HANDLING
// ----------------------------------------------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    // Mount Vite middleware for dev mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('App running in [DEVELOPMENT] mode. Vite dev middlewares mounted.');
  } else {
    // Standard static folder serving for production build
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('App running in [PRODUCTION] mode. Serving static files from dist/.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express application server listening on port ${PORT}`);
  });
}

start();
