# Hybrid Data Model - Implementation Guide

## Architecture Overview

This guide explains how to implement the **hybrid data model** where:
- ✅ **Free data sources** → Proxied through your platform
- ✅ **Trading APIs** → Users provide their own keys

## System Components

```
┌─────────────────┐
│   User's Bot    │
│  (Their Machine)│
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌────────────────┐  ┌──────────────┐
│ Platform APIs  │  │  Polymarket  │
│  (Your Proxy)  │  │     API      │
│                │  │              │
│ • News         │  │ • Trading    │
│ • Weather      │  │ • Markets    │
│ • Social       │  │ • Orders     │
│ • Economics    │  │              │
└────────────────┘  └──────────────┘
     ▲                    ▲
     │                    │
  Your keys          User's keys
```

## Phase 1: Generated Bot Structure

### File Structure
```
exported-bot/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── config/
│   │   └── config.ts               # Configuration
│   ├── data/
│   │   ├── platform.ts             # Platform data APIs
│   │   └── polymarket.ts           # User's Polymarket API
│   ├── strategies/
│   │   ├── arbitrage.ts
│   │   └── marketMaking.ts
│   └── utils/
│       ├── rateLimit.ts
│       └── logger.ts
├── .env.example
├── .env                             # User creates this
├── package.json
├── tsconfig.json
├── docker-compose.yml
└── README.md
```

### Configuration (config.ts)

```typescript
// src/config/config.ts
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Platform APIs (provided by PolyBot Builder)
  platform: {
    apiUrl: 'https://api.polybotbuilder.com',
    apiKey: process.env.PLATFORM_API_KEY,  // Generated for this user
  },

  // Polymarket (user provides)
  polymarket: {
    apiKey: process.env.POLYMARKET_API_KEY,
    secret: process.env.POLYMARKET_SECRET,
    passphrase: process.env.POLYMARKET_PASSPHRASE,
  },

  // Bot settings
  bot: {
    checkInterval: 5000,  // 5 seconds
    maxPositionSize: 1000,
    maxOrdersPerMinute: 30,
  }
};

// Validation
if (!config.polymarket.apiKey) {
  throw new Error('POLYMARKET_API_KEY is required');
}
```

### Platform Data Client (data/platform.ts)

```typescript
// src/data/platform.ts
import axios from 'axios';
import { config } from '../config/config';

class PlatformDataClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = config.platform.apiUrl;
    this.apiKey = config.platform.apiKey;
  }

  /**
   * Get news articles related to a topic
   * Free tier: 100 requests/day per user
   */
  async getNews(query: string, limit: number = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/news`, {
        headers: { 'X-API-Key': this.apiKey },
        params: { q: query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }

  /**
   * Get weather data for a location
   * Free tier: Unlimited (we cache heavily)
   */
  async getWeather(location: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/weather`, {
        headers: { 'X-API-Key': this.apiKey },
        params: { location }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  }

  /**
   * Get Reddit sentiment for a topic
   * Free tier: 50 requests/day per user
   */
  async getRedditSentiment(subreddit: string, keywords: string[]) {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/social/reddit`, {
        headers: { 'X-API-Key': this.apiKey },
        params: { subreddit, keywords: keywords.join(',') }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Reddit sentiment:', error);
      return null;
    }
  }

  /**
   * Get economic data from FRED
   * Free tier: Unlimited
   */
  async getEconomicData(series: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/economics/fred`, {
        headers: { 'X-API-Key': this.apiKey },
        params: { series }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching economic data:', error);
      return null;
    }
  }
}

export const platformData = new PlatformDataClient();
```

### Polymarket Client (data/polymarket.ts)

```typescript
// src/data/polymarket.ts
import { ClobClient } from '@polymarket/clob-client';
import { config } from '../config/config';

class PolymarketClient {
  private client: ClobClient;

  constructor() {
    this.client = new ClobClient({
      key: config.polymarket.apiKey,
      secret: config.polymarket.secret,
      passphrase: config.polymarket.passphrase,
    });
  }

  async getMarket(marketId: string) {
    return await this.client.getMarket(marketId);
  }

  async placeOrder(order: any) {
    return await this.client.placeOrder(order);
  }

  async getBalance() {
    return await this.client.getBalance();
  }

  // ... other Polymarket methods
}

export const polymarket = new PolymarketClient();
```

### Example Strategy (strategies/newsTrading.ts)

```typescript
// src/strategies/newsTrading.ts
import { platformData } from '../data/platform';
import { polymarket } from '../data/polymarket';

export class NewsTradingStrategy {
  private marketId: string;
  private keywords: string[];

  constructor(marketId: string, keywords: string[]) {
    this.marketId = marketId;
    this.keywords = keywords;
  }

  async run() {
    console.log('Checking news...');

    // Get news from platform (free)
    const news = await platformData.getNews(this.keywords.join(' OR '));

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(news);

    if (sentiment > 0.7) {
      // Bullish signal
      const market = await polymarket.getMarket(this.marketId);
      await this.placeBuyOrder(market, sentiment);
    } else if (sentiment < 0.3) {
      // Bearish signal
      const market = await polymarket.getMarket(this.marketId);
      await this.placeSellOrder(market, sentiment);
    }
  }

  private analyzeSentiment(news: any[]): number {
    // Simple sentiment analysis
    // In production: use NLP, ML models, etc.
    let score = 0.5;
    for (const article of news) {
      if (this.isPositive(article.title)) score += 0.1;
      if (this.isNegative(article.title)) score -= 0.1;
    }
    return Math.max(0, Math.min(1, score));
  }

  private isPositive(text: string): boolean {
    const positiveWords = ['win', 'success', 'surge', 'lead', 'victory'];
    return positiveWords.some(word => text.toLowerCase().includes(word));
  }

  private isNegative(text: string): boolean {
    const negativeWords = ['lose', 'fail', 'drop', 'defeat', 'crisis'];
    return negativeWords.some(word => text.toLowerCase().includes(word));
  }

  private async placeBuyOrder(market: any, confidence: number) {
    // Implement order logic
    console.log(`Placing buy order with confidence ${confidence}`);
  }

  private async placeSellOrder(market: any, confidence: number) {
    // Implement order logic
    console.log(`Placing sell order with confidence ${confidence}`);
  }
}
```

### Environment Template (.env.example)

```bash
# =============================================================================
# POLYMARKET API CREDENTIALS (REQUIRED)
# =============================================================================
# You MUST provide these. Get them from: https://polymarket.com/settings/api
# PolyBot Builder NEVER stores or has access to these keys.

POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_SECRET=your_secret_here
POLYMARKET_PASSPHRASE=your_passphrase_here

# =============================================================================
# PLATFORM DATA API (PROVIDED)
# =============================================================================
# This key is generated by PolyBot Builder and gives you access to free data.
# It's included in your exported bot automatically.

PLATFORM_API_KEY=pb_xxxxxxxxxxxxxxxxxxxx

# =============================================================================
# OPTIONAL: PREMIUM DATA SOURCES
# =============================================================================
# Add your own premium data API keys here if you want:

# NEWS_API_KEY=your_newsapi_key
# TWITTER_BEARER_TOKEN=your_twitter_token
# BLOOMBERG_API_KEY=your_bloomberg_key

# =============================================================================
# BOT CONFIGURATION (OPTIONAL)
# =============================================================================

# Trading limits
MAX_POSITION_SIZE=1000
MAX_ORDERS_PER_MINUTE=30
MAX_DAILY_LOSS=500

# Monitoring
LOG_LEVEL=info
ALERT_EMAIL=your_email@example.com
```

## Phase 2: Platform API Implementation

### Backend Structure
```
platform-api/
├── src/
│   ├── routes/
│   │   ├── news.ts
│   │   ├── weather.ts
│   │   ├── social.ts
│   │   └── economics.ts
│   ├── middleware/
│   │   ├── auth.ts              # Verify user's platform API key
│   │   ├── rateLimit.ts         # Per-user rate limiting
│   │   └── cache.ts             # Cache responses
│   ├── services/
│   │   ├── newsapi.ts           # NewsAPI integration
│   │   ├── openweather.ts       # OpenWeather integration
│   │   └── reddit.ts            # Reddit integration
│   └── index.ts
├── .env                          # Your API keys for data sources
└── package.json
```

### News API Route (routes/news.ts)

```typescript
// src/routes/news.ts
import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import { cache } from '../middleware/cache';
import { NewsAPIService } from '../services/newsapi';

const router = express.Router();
const newsService = new NewsAPIService(process.env.NEWSAPI_KEY);

router.get('/news',
  authenticateUser,                    // Verify user's platform API key
  rateLimit({ max: 100, window: '1d' }), // 100 requests per day
  cache({ ttl: 300 }),                 // Cache for 5 minutes
  async (req, res) => {
    const { q, limit = 10 } = req.query;

    try {
      const articles = await newsService.search(q as string, limit as number);
      res.json({ articles, cached: false });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch news' });
    }
  }
);

export default router;
```

### Authentication Middleware (middleware/auth.ts)

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyApiKey } from '../services/database';

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const user = await verifyApiKey(apiKey as string);
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.user = user;  // Attach user to request
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}
```

### Rate Limiting (middleware/rateLimit.ts)

```typescript
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export function createRateLimit(options: { max: number; window: string }) {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:',
    }),
    windowMs: parseWindow(options.window),
    max: options.max,
    keyGenerator: (req) => req.user.id,  // Per-user limiting
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        limit: options.max,
        window: options.window,
      });
    },
  });
}

function parseWindow(window: string): number {
  // '1d' -> 86400000, '1h' -> 3600000, etc.
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = window.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error('Invalid window format');
  return parseInt(match[1]) * units[match[2]];
}
```

## Phase 3: User Onboarding Flow

### When User Subscribes:

1. **Generate Platform API Key**
   ```typescript
   const platformApiKey = generateSecureToken(); // pb_xxxxx
   await db.users.update(userId, { platformApiKey });
   ```

2. **Include in Exported Bot**
   ```typescript
   // Automatically add to .env file in exported bot
   PLATFORM_API_KEY=${user.platformApiKey}
   ```

3. **Show Setup Instructions**
   ```markdown
   ## Setup Instructions

   1. Add your Polymarket API credentials to `.env`:
      - Get them from: https://polymarket.com/settings/api
      - NEVER share these with anyone
      - PolyBot Builder never stores these

   2. Your platform API key is already included for free data access

   3. Run: `npm install && npm start`
   ```

## Rate Limits & Quotas

### Free Tier
- **News API**: 100 requests/day
- **Weather API**: Unlimited (cached)
- **Reddit Sentiment**: 50 requests/day
- **Economic Data**: Unlimited

### Paid Tier ($30/month)
- **News API**: 500 requests/day
- **Weather API**: Unlimited
- **Reddit Sentiment**: 200 requests/day
- **Economic Data**: Unlimited
- **Priority support**

### Enterprise (Custom)
- Unlimited API calls
- Dedicated infrastructure
- Custom data sources
- SLA guarantees

## Security Best Practices

### API Key Management
```typescript
// GOOD: User's keys in their .env file
POLYMARKET_API_KEY=xxx

// BAD: Never hardcode
const apiKey = 'pk_live_xxxx';  // ❌ NEVER DO THIS
```

### Platform API Keys
```typescript
// Generated per user, not per bot
// Allows tracking usage and rate limiting
// Can be revoked if abused
```

### Key Rotation
```typescript
// Allow users to regenerate platform API key
async function regeneratePlatformKey(userId: string) {
  const newKey = generateSecureToken();
  await db.users.update(userId, { platformApiKey: newKey });
  return newKey;
}
```

## Monitoring & Analytics

### Track Per-User Usage
```typescript
await redis.incr(`usage:${userId}:news:${today}`);
await redis.incr(`usage:${userId}:weather:${today}`);
```

### Alert on Abuse
```typescript
if (requestsToday > threshold * 2) {
  await alertAdmin(`User ${userId} exceeding rate limits`);
}
```

### Dashboard
Show users their usage:
- API calls made today
- Remaining quota
- Historical usage charts

## Cost Management

### Free Data Sources (Monthly Costs)
- **NewsAPI**: $0 (free tier)
- **OpenWeather**: $0 (free tier)
- **Reddit**: $0 (public data)
- **FRED**: $0 (public API)
- **Infrastructure**: ~$50/month (hosting, Redis, DB)

### When You Need to Upgrade
If your user base grows:
- NewsAPI Pro: $449/month (250K calls/month)
- OpenWeather: $40/month (60K calls/day)
- Caching reduces costs significantly

## Summary

This hybrid model gives you:
- ✅ **Legal protection** - No custody of trading keys
- ✅ **Better UX** - Users don't need multiple API keys
- ✅ **Low costs** - Free tiers are generous
- ✅ **Scalability** - Can upgrade data sources as needed
- ✅ **Security** - Users control their trading credentials

**Next Steps:**
1. Build the MVP with code generation
2. Set up platform API proxy
3. Implement rate limiting and caching
4. Monitor costs and usage
5. Scale data sources as user base grows

---

**Questions?** This architecture is battle-tested and used by similar platforms. It's the right balance of security, UX, and cost.
