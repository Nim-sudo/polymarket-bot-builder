# Architecture & Security Model

## Core Philosophy: Your Keys, Your Control

PolyBot Builder is designed as a **code generation tool**, not a trading service. This architectural decision provides significant legal, security, and privacy benefits.

## How It Works

```
┌─────────────┐
│   User      │
│ (Web Browser)│
└──────┬──────┘
       │
       │ Chat Interface
       ▼
┌──────────────────┐
│  PolyBot Builder │
│   (Our Platform) │
│                  │
│  - AI Chat       │
│  - Code Gen      │
│  - Templates     │
└──────┬───────────┘
       │
       │ Exports Code
       ▼
┌──────────────────┐
│   User's Machine │
│   (or VPS/Cloud) │
│                  │
│  - Runs Bot      │
│  - Has API Keys  │
│  - Executes      │
│    Trades        │
└──────┬───────────┘
       │
       │ User's API Keys
       ▼
┌──────────────────┐
│   Polymarket     │
│   CLOB API       │
└──────────────────┘
```

## What We DO

✅ **Generate code** based on user's strategy description
✅ **Provide templates** for common trading strategies
✅ **Offer free data feeds** (news, weather, public data)
✅ **Create documentation** for the generated bot
✅ **Validate bot logic** before export

## What We DON'T DO

❌ **Store API keys** - Never touch user credentials
❌ **Execute trades** - Users run bots themselves
❌ **Hold funds** - No custody of user assets
❌ **Access wallets** - No interaction with user funds
❌ **Host bots** - Users deploy where they want (initially)

## Security Benefits

### 1. Zero Credential Storage
- We never see or store Polymarket API keys
- No database of user credentials to protect
- No risk of API key leaks from our platform
- Users manage their own security

### 2. No Custody Risk
- We don't hold user funds
- No hot wallet security concerns
- Users maintain full control of assets
- Reduced attack surface

### 3. Privacy First
- Minimal user data collection
- No trading history stored
- No position data on our servers
- GDPR/privacy compliant by design

### 4. Reduced Liability
- Users responsible for their own trading
- No "operating a trading platform" regulations
- Clear legal separation from execution
- Terms of service as a software tool

## Legal Classification

### What We Are:
**Software-as-a-Service (SaaS) Code Generation Tool**

Similar to:
- GitHub Copilot (code assistant)
- Replit (code IDE)
- TradingView (charting/scripting platform)

### What We're NOT:
- ❌ Money transmitter
- ❌ Broker-dealer
- ❌ Investment advisor
- ❌ Cryptocurrency exchange
- ❌ Custodial service

## Data Sources Architecture

### Free Data (Provided by Platform)

We can safely provide these without major liability:

#### News APIs
```typescript
// Free tier, proxied through our platform
const news = await platform.getNews({
  query: 'Trump election',
  sources: ['reuters', 'ap']
});
```

**Options:**
- NewsAPI (100 requests/day free)
- RSS feeds (unlimited)
- Public news aggregators

#### Weather Data
```typescript
const weather = await platform.getWeather({
  location: 'New York',
  provider: 'openweather'
});
```

**Options:**
- OpenWeatherMap (1M calls/month free)
- WeatherAPI (1M calls/month free)

#### Social Media
```typescript
// Reddit public data (no auth needed)
const sentiment = await platform.getRedditSentiment({
  subreddit: 'politics',
  keywords: ['election']
});
```

**Options:**
- Reddit RSS feeds (no API key)
- Twitter free tier (limited)
- Public scraping (legal with rate limits)

#### Economic Data
```typescript
const economicData = await platform.getFredData({
  series: 'UNRATE' // Unemployment rate
});
```

**Options:**
- FRED API (Federal Reserve Economic Data) - free, unlimited
- World Bank API - free
- Public economic indicators

### Paid/Private Data (User Provides)

Users add their own credentials for:

#### Polymarket Trading
```typescript
// User provides in .env file
const client = new ClobClient({
  apiKey: process.env.POLYMARKET_API_KEY,
  secret: process.env.POLYMARKET_SECRET,
  passphrase: process.env.POLYMARKET_PASSPHRASE
});
```

#### Premium News/Data
```typescript
// Optional: user's own premium APIs
const premiumNews = await fetchNews({
  apiKey: process.env.BLOOMBERG_API_KEY // User's key
});
```

## Generated Bot Structure

```
exported-bot/
├── src/
│   ├── bot.ts                 # Main bot logic
│   ├── strategies/            # Trading strategies
│   │   ├── arbitrage.ts
│   │   └── marketMaking.ts
│   ├── data/                  # Data sources
│   │   ├── polymarket.ts      # User's API
│   │   ├── news.ts            # Platform proxy
│   │   └── weather.ts         # Platform proxy
│   └── utils/
│       ├── rateLimit.ts
│       └── validation.ts
├── .env.example               # Template for API keys
├── .env                       # User creates this
├── docker-compose.yml
├── package.json
└── README.md                  # Deployment guide
```

### .env.example Template
```bash
# Polymarket API Credentials (REQUIRED - you provide these)
POLYMARKET_API_KEY=your_api_key_here
POLYMARKET_SECRET=your_secret_here
POLYMARKET_PASSPHRASE=your_passphrase_here

# Platform Data APIs (OPTIONAL - provided by PolyBot Builder)
PLATFORM_API_KEY=pbXXXXXXXXXX

# Premium Data Sources (OPTIONAL - you provide if you want them)
# NEWS_API_KEY=your_newsapi_key
# TWITTER_BEARER_TOKEN=your_twitter_token
```

## Future: Managed Hosting Platform

Eventually, we'll offer optional managed hosting with:

### User Benefits:
- One-click deployment
- No infrastructure management
- Built-in monitoring
- Better UX than VS Code

### Security Approach:
- **Encrypted credential storage** (user's keys encrypted at rest)
- **Isolated execution** (each bot in separate container)
- **No cross-user access**
- **User can revoke/rotate keys** anytime
- **Optional: user-managed key vault** (they control encryption keys)

### Legal Compliance:
- Still a "hosting service" not a "trading service"
- Users grant us permission to run their code
- Clear ToS about responsibilities
- SOC 2 Type II compliance
- Regular security audits

## Regulatory Considerations

### Current Model (Export Only)

**Minimal Regulatory Burden:**
- No FinCEN registration needed (not touching funds)
- No SEC/FINRA (not a broker)
- No state money transmitter licenses
- Software license sufficient

**Requirements:**
- Terms of Service
- Privacy Policy
- DMCA compliance (if user-generated content)
- Standard SaaS legal protection

### Future Hosting Model

**Additional Considerations:**
- Data protection regulations (GDPR, CCPA)
- Infrastructure security standards
- Cybersecurity insurance
- Incident response plan
- SOC 2 compliance recommended

**Still NOT Required:**
- Money transmitter licenses (we don't move funds)
- Broker-dealer registration (users execute their own trades)
- Cryptocurrency exchange licenses (not an exchange)

## Risk Mitigation

### For The Platform

1. **Clear Terms of Service**
   - User responsible for compliance
   - Platform is a tool, not financial advice
   - No guarantee of profits
   - Risk disclosures

2. **Rate Limiting**
   - Prevent platform abuse
   - Protect free data sources
   - Fair usage policies

3. **Content Moderation**
   - No illegal trading strategies
   - No market manipulation code
   - Compliance with platform policies

4. **Legal Reviews**
   - Regular ToS updates
   - Compliance monitoring
   - Legal counsel consultation

### For Users

Generated bots include:

1. **Safety Limits**
   ```typescript
   const SAFETY_LIMITS = {
     maxPositionSize: 1000,
     maxOrdersPerMinute: 30,
     maxDailyLoss: 500,
     emergencyStopLoss: 0.20
   };
   ```

2. **Risk Warnings**
   - README with disclaimers
   - Trading risks clearly stated
   - Testing recommendations

3. **Kill Switches**
   ```typescript
   if (dailyLoss > SAFETY_LIMITS.maxDailyLoss) {
     await emergencyShutdown();
   }
   ```

## Comparison to Similar Platforms

### TradingView Pine Script
- **Similarity**: Code generation for trading strategies
- **Difference**: TradingView has broker integrations (more regulatory complexity)

### GitHub Copilot
- **Similarity**: AI code generation tool
- **Difference**: General purpose vs. trading specific

### QuantConnect / Quantopian
- **Similarity**: Algorithmic trading platforms
- **Difference**: They host execution (more liability), we export code

### Best Model For Us: "VS Code for Trading Bots"
- Tool, not service
- Code generation, not execution
- User deploys, we don't host (initially)
- Clean legal separation

## Recommended Next Steps

### Phase 1: Validate Model (Current)
- [x] Landing page with clear positioning
- [x] Security-first messaging
- [x] Legal research complete
- [ ] User feedback on architecture
- [ ] Legal review of ToS/Privacy Policy

### Phase 2: Build MVP
- [ ] Chat-based code generation
- [ ] Template library
- [ ] Free data source integrations
- [ ] Export functionality
- [ ] Documentation generation

### Phase 3: Platform Data
- [ ] News API proxy (free tier)
- [ ] Weather API proxy
- [ ] Social sentiment analysis
- [ ] Economic data feeds
- [ ] Rate limiting per user

### Phase 4: Managed Hosting (Optional)
- [ ] Encrypted key storage
- [ ] Container orchestration
- [ ] Monitoring dashboard
- [ ] Legal review for hosting
- [ ] SOC 2 compliance

## Conclusion

This architecture provides:
- ✅ **Security**: No API keys stored, no funds custody
- ✅ **Privacy**: Minimal user data, GDPR compliant
- ✅ **Legal**: Clean classification as software tool
- ✅ **Scalability**: Can add hosting later
- ✅ **User Control**: Users own their code and keys

**Bottom Line**: We're building "VS Code for Polymarket bots" - a tool that generates code, not a platform that executes trades.

---

**Questions or Concerns?**
This architecture is designed for maximum legal protection while delivering value to users. Open to feedback and refinement as we validate with real users.
