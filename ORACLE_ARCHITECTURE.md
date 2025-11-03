# Oracle Architecture for Esports Prediction Markets

## Overview

This document outlines the Switchboard oracle integration for automated settlement of esports prediction markets on the Espotz platform.

## Architecture Components

### 1. Oracle Data Flow

```
Game API → Switchboard Oracle Job → Quote Verification → Smart Contract Settlement
```

### 2. Smart Contract Structure

#### Accounts

| Account | Purpose |
|---------|---------|
| `PredictionMarket` | Market metadata, type, status, liquidity pools |
| `UserPosition` | Individual user's bet position and shares |
| `OracleConfig` | Switchboard oracle feed configuration |

#### PDAs

```
PredictionMarket: [b"prediction-market", tournament_key, market_id]
UserPosition:     [b"user-position", market_key, user_key]
OracleConfig:     [b"oracle-config", market_key]
VaultAuthority:   [b"market-vault-authority", market_key]
VaultToken:       [b"market-vault-token", market_key]
```

### 3. Market Types

| Market Type | Oracle Data Source | Settlement Trigger |
|-------------|-------------------|-------------------|
| First Kill | Game Event API | First player elimination |
| MVP | Match Result API | Match completion |
| Total Kills | Game Stats API | Match completion |
| Round Winner | Match Result API | Round completion |

### 4. Oracle Integration Pattern

Using Switchboard On-Demand Oracles:

```rust
// Verify oracle quote
let quote = QuoteVerify {
    oracle_signer: ctx.accounts.oracle_signer.key(),
    guardian_queue: ctx.accounts.guardian_queue.key(),
    // ... other fields
};

// Validate oracle data
quote.verify(&ctx.accounts.quote_account)?;

// Extract result and settle market
let result = quote.result;
settle_market(result)?;
```

### 5. Binary Pool Pricing Model

Markets use YES/NO pools with automatic pricing:

```
YES Price = YES Pool / (YES Pool + NO Pool)
NO Price = NO Pool / (YES Pool + NO Pool)
```

### 6. Oracle Job Configuration

Custom Switchboard job for fetching esports data:

```json
{
  "tasks": [
    {
      "httpTask": {
        "url": "https://api.esports-data.com/match/${MATCH_ID}/events"
      }
    },
    {
      "jsonParseTask": {
        "path": "$.events[0].type"
      }
    }
  ]
}
```

## Implementation Phases

### Phase 1: Core Prediction Market Contract ✅ (Current)
- Market creation and management
- User position tracking
- Binary pool pricing logic

### Phase 2: Switchboard Oracle Integration (Next)
- Add Switchboard SDK dependencies
- Implement QuoteVerifier
- Create oracle job definitions

### Phase 3: Automated Settlement
- Event listener service
- Trigger oracle updates
- Automatic prize distribution

## Security Considerations

- Oracle quote verification using ED25519 signatures
- Guardian queue validation
- Staleness checks on oracle data
- Admin controls for emergency market resolution

## Technical Requirements

### Dependencies

```toml
[dependencies]
anchor-lang = "0.32.1"
anchor-spl = "0.32.1"
switchboard-on-demand = "0.1.14"
```

### RPC Requirements

- Switchboard Gateway access for oracle quotes
- WebSocket support for real-time updates
- Free tier: 30 requests/min

## Next Steps

1. Create prediction market smart contract structure
2. Add Switchboard dependencies
3. Implement oracle verification logic
4. Build frontend integration
5. Create test suite with mock oracle data
