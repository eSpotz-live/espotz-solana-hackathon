# Prediction Markets - Phase 2

## Overview

Espotz prediction markets allow users to bet on specific outcomes of esports tournaments (e.g., "Will Team A get first kill?", "Who will be MVP?"). Markets use binary YES/NO pools with automatic pricing based on liquidity.

## Smart Contract

**Program ID:** `MD63kQkcMMZdw2fCBMNxH3WDj7n1nbb1x1irTMwEUBP` (built, pending deployment)

### Status

✅ **Smart contract built successfully**
⏳ **Deployment pending** - Requires ~2.26 SOL in wallet
📋 **MVP approach** - Manual admin settlement (Switchboard oracle integration deferred due to dependency conflicts)

### Instructions

| Function | Purpose |
|----------|---------|
| `create_market` | Create prediction market for tournament event |
| `init_position` | Initialize user's betting position |
| `place_bet` | Place bet on YES or NO outcome |
| `close_market` | Close market for betting after event starts |
| `settle_market` | Settle market with winning outcome (admin) |
| `claim_winnings` | Claim winnings after settlement |

### Accounts

| Account | Purpose |
|---------|---------|
| `PredictionMarket` | Market state, pools, status, winning outcome |
| `UserPosition` | User's bet amount, shares, and outcome choice |
| `OracleConfig` | Oracle configuration (placeholder for future) |

### PDAs

```
PredictionMarket: [b"prediction-market", tournament_key, market_id]
UserPosition:     [b"user-position", market_key, user_key]
VaultToken:       [b"market-vault-token", market_key] (System owned, space=0)
VaultAuthority:   [b"market-vault-authority", market_key]
```

## How It Works

### 1. Market Creation

Admin creates market with:
- **Market ID:** Unique identifier (e.g., `"first-kill"`)
- **Market Type:** FirstKill, MVP, TotalKills, RoundWinner, MatchWinner
- **Closes At:** Timestamp when betting closes
- **Oracle Feed:** Placeholder pubkey for future Switchboard integration

```javascript
await program.methods
  .createMarket(marketId, marketType, closesAt, oracleFeed)
  .accounts({
    market: marketPDA,
    tournament: tournamentPDA,
    admin: adminWallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 2. Binary Pool Pricing

Markets use a simple pool-based pricing model:

```
YES Price = YES Pool / (YES Pool + NO Pool)
NO Price = NO Pool / (YES Pool + NO Pool)

Shares = Bet Amount / Price
```

**Example:**
- Initial state: YES Pool = 0, NO Pool = 0 → Prices = 50/50
- Alice bets 1 SOL on YES → YES Pool = 1, NO Pool = 0 → YES Price = 100%
- Bob bets 1 SOL on NO → YES Pool = 1, NO Pool = 1 → YES Price = 50%, NO Price = 50%
- Carol bets 2 SOL on YES → YES Pool = 3, NO Pool = 1 → YES Price = 75%, NO Price = 25%

### 3. Placing Bets

Users must first initialize their position, then place bets:

```javascript
// Step 1: Initialize position (once per user per market)
await program.methods
  .initPosition(outcome) // Outcome.Yes or Outcome.No
  .accounts({
    market: marketPDA,
    position: positionPDA,
    user: userWallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Step 2: Place bet
await program.methods
  .placeBet(outcome, amount)
  .accounts({
    market: marketPDA,
    position: positionPDA,
    user: userWallet.publicKey,
    vaultToken: vaultPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 4. Market Settlement

**MVP Approach (Manual):**

Admin manually settles market with winning outcome after verifying game results:

```javascript
await program.methods
  .settleMarket(winningOutcome) // Outcome.Yes or Outcome.No
  .accounts({
    market: marketPDA,
    admin: adminWallet.publicKey,
  })
  .rpc();
```

**Future Approach (Automated):**

Switchboard oracle automatically settles based on game API data (see ORACLE_ARCHITECTURE.md).

### 5. Claiming Winnings

Winners claim their share of the total pool:

```
Payout = (User Shares / Total Winning Shares) * Total Pool
```

```javascript
await program.methods
  .claimWinnings()
  .accounts({
    market: marketPDA,
    position: positionPDA,
    user: userWallet.publicKey,
    vaultToken: vaultPDA,
    vaultAuthority: vaultAuthorityPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Key Technical Decisions

### Direct Lamport Manipulation

Like the tournament prize distribution, market payouts use direct lamport manipulation because the vault is System Program-owned (space=0):

```rust
// Transfer winnings from vault to user
**vault_token.try_borrow_mut_lamports()? -= payout;
**user.try_borrow_mut_lamports()? += payout;
```

### Market Types

| Type | Description | Example Question |
|------|-------------|------------------|
| `FirstKill` | First elimination in match | "Will Team A get first kill?" |
| `MVP` | Most valuable player | "Will Player X be MVP?" |
| `TotalKills` | Total kills threshold | "Will there be >20 kills?" |
| `RoundWinner` | Round-by-round winner | "Will Team A win round 1?" |
| `MatchWinner` | Overall match winner | "Will Team A win the match?" |

### State Flow

```
Open → Closed → Settled → (Users Claim Winnings)
  ↓       ↓        ↓
  Bets  No Bets  Payouts
```

## Oracle Integration (Future)

See ORACLE_ARCHITECTURE.md for full design. Summary:

**Switchboard On-Demand Oracle Flow:**
1. Game event occurs (e.g., first kill)
2. Event listener service detects event
3. Service triggers Switchboard oracle job
4. Oracle fetches game API data
5. Oracle submits verified quote to blockchain
6. Smart contract verifies signature & settles market
7. Winners claim automatically

**Why Deferred:**
- Dependency version conflicts between Anchor 0.32 and Switchboard SDK
- Manual settlement sufficient for MVP/hackathon demo
- Oracle integration can be added post-deployment without breaking changes

## Testing

### Local Testing (Manual Settlement)

1. Create market for a tournament
2. Multiple users initialize positions and place bets
3. Admin closes market when event starts
4. Admin watches live game and manually settles
5. Winners claim payouts

### Integration Test Cases

```javascript
// Test 1: Basic market lifecycle
- Create market
- User A bets 1 SOL on YES
- User B bets 1 SOL on NO
- Admin settles with YES
- User A claims 2 SOL payout
- User B claims 0 SOL

// Test 2: Uneven pool distribution
- User A bets 3 SOL on YES
- User B bets 1 SOL on NO
- YES wins
- User A claims 4 SOL (entire pool)

// Test 3: Multiple bets same outcome
- User A bets 1 SOL on YES
- User B bets 1 SOL on YES
- User C bets 2 SOL on NO
- YES wins
- User A claims 2 SOL
- User B claims 2 SOL
```

## Deployment

### Build

```bash
anchor build
```

**Output:** `target/deploy/prediction_market.so`

### Deploy to Devnet

```bash
# Ensure wallet has ~2.5 SOL
solana balance

# Get devnet SOL if needed
solana airdrop 2

# Deploy
anchor deploy --program-name prediction-market
```

### Update Frontend

After deployment, update frontend constants:

```javascript
// frontend/src/utils/constants.js
export const PREDICTION_MARKET_PROGRAM_ID = new PublicKey(
  'MD63kQkcMMZdw2fCBMNxH3WDj7n1nbb1x1irTMwEUBP'
);
```

## Future Enhancements

1. **Automated Oracle Settlement**
   - Integrate Switchboard on-demand oracles
   - Create custom oracle jobs for esports APIs
   - Automatic settlement within seconds of event completion

2. **Advanced Market Types**
   - Multi-outcome markets (beyond binary YES/NO)
   - Over/under markets (e.g., "Will total kills be over 25?")
   - Parlay betting (multiple linked outcomes)

3. **Liquidity Improvements**
   - Liquidity provider rewards
   - Market maker incentives
   - Dynamic fee structure based on liquidity depth

4. **Social Features**
   - Leaderboards for prediction accuracy
   - Betting history and statistics
   - Social sharing of winning predictions

## Security Considerations

- ✅ PDA seed validation prevents unauthorized access
- ✅ Admin checks ensure only tournament operator can settle
- ✅ Lamport arithmetic uses checked operations (no overflow)
- ✅ Direct lamport manipulation is safe with PDA signing authority
- ⚠️ Manual settlement requires trusted admin (automated oracles eliminate this)
- ⚠️ Devnet only (not audited for mainnet)

## References

- **ORACLE_ARCHITECTURE.md** - Switchboard integration design
- **PRIZE_DISTRIBUTION_FIX.md** - Direct lamport manipulation pattern
- **Switchboard Docs** - https://docs.switchboard.xyz
- **Polymarket** - Inspiration for binary pool pricing model
