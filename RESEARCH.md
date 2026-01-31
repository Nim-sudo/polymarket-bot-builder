# Polymarket API Research & Technical Constraints

This document compiles research on Polymarket's API, trading infrastructure, and constraints relevant to building trading bots.

## API Overview

### CLOB (Central Limit Order Book) API

**Base URL**: `https://clob.polymarket.com`
**WebSocket**: `wss://ws-subscriptions-clob.polymarket.com/ws/`

Polymarket uses a CLOB architecture for efficient order matching and price discovery.

## Authentication

### Two-Tier Authentication System

#### L1 Authentication (Private Key)
- Uses wallet's private key
- Signs EIP-712 messages
- Included in request headers
- Required for trading operations

#### L2 Authentication (API Key)
- API credentials (key, secret, passphrase)
- HMAC-SHA256 signatures
- 30-second expiration on timestamps
- Used for authenticated API calls

### Implementation Example
```typescript
import { ClobClient } from '@polymarket/clob-client';

const client = new ClobClient({
  key: process.env.POLYMARKET_API_KEY,
  secret: process.env.POLYMARKET_SECRET,
  passphrase: process.env.POLYMARKET_PASSPHRASE,
});
```

## Rate Limits

### Public Endpoints
- **Limit**: 100 requests per minute per IP address
- **Use cases**: Market data, price quotes, order book snapshots
- **No authentication required**

### Trading Endpoints
- **Limit**: 60 orders per minute per API key
- **Use cases**: Placing orders, canceling orders, managing positions
- **Authentication required**

### WebSocket Connections
- Real-time order book updates
- No strict rate limit on messages
- Connection limits may apply per account
- Recommended: Single persistent connection with multiple subscriptions

### Best Practices
```typescript
// Implement rate limiting
const rateLimiter = new RateLimiter({
  publicEndpoints: { maxRequests: 100, perMinutes: 1 },
  tradingEndpoints: { maxRequests: 60, perMinutes: 1 }
});

await rateLimiter.checkLimit('public');
const marketData = await client.getMarket(marketId);
```

## Trading Constraints

### Order Size Constraints

#### Minimum Order Size
- Varies by market
- Returned in `min_order_size` field from `get-book` response
- Prevents dust orders
- Typically ranges from $1 to $10 equivalent

#### Maximum Order Size
- No hard maximum enforced by platform
- Limited by:
  - Available wallet balance
  - Market liquidity
  - Practical execution constraints

### Price Constraints

#### Tick Size
- Minimum price increment for orders
- **Dynamic based on price level**:
  - Price > 0.96: Smaller tick size
  - Price < 0.04: Smaller tick size
  - Between 0.04-0.96: Standard tick size
- Retrieved from market metadata (`tick_size` field)

#### Price Validation
```typescript
function validatePrice(price: number, tickSize: number): boolean {
  const remainder = price % tickSize;
  return remainder < 0.0000001; // Floating point tolerance
}
```

### Balance Requirements

#### Pre-Trade Validation
```typescript
async function checkBalance(client: ClobClient, amount: number): Promise<boolean> {
  const balance = await client.getBalance();
  return balance >= amount;
}
```

#### Position Limits
- Self-imposed limits recommended
- No platform-enforced position limits
- Consider:
  - Maximum exposure per market
  - Portfolio-level risk limits
  - Correlation between positions

## Fee Structure

### Current Fees (As of 2026)
- **Maker Fee**: 0%
- **Taker Fee**: 0%
- **Standard Trading Fee**: 0.5-1% on executed orders

### Fee Changes
- Fees subject to change
- Always verify current fee structure
- Check Polymarket documentation for updates

**Note**: While CLOB maker/taker fees are currently 0%, standard trading fees still apply.

## Official SDKs

### TypeScript SDK
```bash
npm install @polymarket/clob-client
```

**Features**:
- Full type definitions
- Promise-based async API
- Automatic request signing
- Built-in rate limiting support

### Python SDK
```bash
pip install py-clob-client
```

**Features**:
- Async/await support
- Type hints
- Compatible with asyncio
- Market data utilities

### Rust SDK
```bash
cargo add rs-clob-client
```

**Features**:
- High performance
- Memory safe
- Ergonomic API
- Suitable for HFT applications

## WebSocket Integration

### Real-Time Order Book

```typescript
const ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    markets: [marketId],
    assets: [assetId]
  }));
});

ws.on('message', (data) => {
  const update = JSON.parse(data);
  // Handle order book update
});
```

### Benefits
- Ultra-low latency updates
- Efficient bandwidth usage
- Real-time price discovery
- Immediate order status updates

## Market Data Endpoints

### Key Endpoints

1. **Get Markets**
   - `GET /markets`
   - Returns all available markets

2. **Get Order Book**
   - `GET /book?market={market_id}`
   - Returns current bids and asks

3. **Get Ticker**
   - `GET /ticker?market={market_id}`
   - 24h price data, volume, etc.

4. **Get Trades**
   - `GET /trades?market={market_id}`
   - Recent trade history

## Trading Operations

### Place Order

```typescript
const order = {
  marketId: 'market_id',
  side: 'BUY', // or 'SELL'
  price: 0.65,
  size: 100,
  orderType: 'LIMIT' // or 'MARKET'
};

const result = await client.placeOrder(order);
```

### Cancel Order

```typescript
await client.cancelOrder(orderId);
```

### Get Open Orders

```typescript
const openOrders = await client.getOpenOrders();
```

## Bot Strategy Considerations

### Arbitrage Bots
- Monitor multiple similar markets
- Calculate profit after fees
- Account for execution time
- Consider market impact

### Market Making
- Maintain bid-ask spread
- Adjust quotes based on inventory
- Implement inventory skew
- React to market volatility

### News-Driven Bots
- Integrate news APIs
- Natural language processing
- Event detection algorithms
- Fast execution critical

### Limit Order Strategies
- Price level monitoring
- Volume-weighted execution
- Time-based orders
- Iceberg orders (hidden size)

## Risk Management

### Essential Safeguards

1. **Position Limits**
   ```typescript
   const MAX_POSITION_SIZE = 10000;
   const MAX_MARKET_EXPOSURE = 0.20; // 20% of portfolio
   ```

2. **Stop Loss**
   ```typescript
   if (currentPosition.pnl < -MAX_LOSS) {
     await closePosition(currentPosition);
   }
   ```

3. **Kill Switch**
   ```typescript
   if (isMarketAbnormal() || isConnectionUnstable()) {
     await cancelAllOrders();
     await closeAllPositions();
   }
   ```

4. **Order Validation**
   ```typescript
   function validateOrder(order: Order): boolean {
     return (
       order.size >= MIN_ORDER_SIZE &&
       order.price > 0 &&
       order.price < 1 &&
       order.price % TICK_SIZE === 0
     );
   }
   ```

## Error Handling

### Common Errors

1. **Insufficient Balance**
   - Check balance before order
   - Reserve funds for fees
   - Implement balance monitoring

2. **Invalid Price**
   - Validate against tick size
   - Round to nearest valid price
   - Check price bounds (0-1)

3. **Rate Limit Exceeded**
   - Implement exponential backoff
   - Queue requests
   - Monitor rate limit headers

4. **Order Rejection**
   - Parse rejection reason
   - Adjust order parameters
   - Log for analysis

### Error Handling Example
```typescript
try {
  await client.placeOrder(order);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    await handleInsufficientBalance();
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    await sleep(60000); // Wait 1 minute
    await retryOrder(order);
  } else {
    logger.error('Unknown error:', error);
    await alertAdmin(error);
  }
}
```

## Testing & Development

### Testnet
- Check Polymarket documentation for testnet availability
- Use test funds
- Validate strategies before production

### Backtesting
- Historical market data access
- Simulate order execution
- Account for fees and slippage
- Validate assumptions

### Paper Trading
- Live market data
- Simulated orders
- Real-time strategy validation
- Risk-free testing

## Performance Optimization

### Connection Pooling
```typescript
const pool = new ConnectionPool({
  maxConnections: 5,
  keepAlive: true
});
```

### Caching
```typescript
const cache = new LRUCache({
  max: 1000,
  ttl: 5000 // 5 seconds
});
```

### Async Operations
```typescript
const [balance, positions, openOrders] = await Promise.all([
  client.getBalance(),
  client.getPositions(),
  client.getOpenOrders()
]);
```

## Monitoring & Logging

### Key Metrics
- Orders placed per minute
- Fill rate
- Slippage
- P&L by strategy
- API latency
- Error rate

### Logging Best Practices
```typescript
logger.info('Order placed', {
  orderId,
  market,
  side,
  price,
  size,
  timestamp: Date.now()
});
```

## Resources

### Official Documentation
- [Polymarket Docs](https://docs.polymarket.com/)
- [CLOB API Reference](https://docs.polymarket.com/developers/CLOB/introduction)
- [Authentication Guide](https://docs.polymarket.com/developers/CLOB/authentication)
- [Rate Limits](https://docs.polymarket.com/quickstart/introduction/rate-limits)

### Community Resources
- [GitHub - Polymarket Agents](https://github.com/Polymarket/agents)
- [Medium - Polymarket API Guide](https://medium.com/@gwrx2005/the-polymarket-api-architecture-endpoints-and-use-cases-f1d88fa6c1bf)
- [QuantVPS - Polymarket Bot Setup](https://www.quantvps.com/blog/setup-polymarket-trading-bot)

### Additional Reading
- Prediction market dynamics
- Order book mechanics
- Market making strategies
- Algorithmic trading best practices

## Disclaimer

This research is provided for educational purposes. Trading involves risk. Always:
- Test thoroughly before deploying with real funds
- Start with small position sizes
- Monitor bots continuously
- Have risk management safeguards
- Stay updated with Polymarket's terms of service

---

**Last Updated**: January 2026
**Research Sources**: Polymarket official documentation, community guides, and API testing
