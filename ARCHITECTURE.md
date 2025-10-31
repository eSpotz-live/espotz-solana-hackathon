# System Architecture

## Overview

Espotz is a decentralized tournament platform where:
1. Tournament operators create tournaments
2. Players register and pay entry fees
3. Operators submit results
4. Smart contract distributes prizes automatically

## Smart Contract (Rust + Anchor)

**Program ID:** `BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv`

### Instructions (Functions)

| Function | Purpose |
|----------|---------|
| `create_tournament` | Create new tournament with entry fee |
| `register_player` | Player registers and pays entry fee |
| `start_tournament` | Mark tournament as active |
| `submit_results` | Declare winners |
| `distribute_prizes` | Send SOL to winners |
| `cancel_tournament` | Cancel tournament |
| `claim_refund` | Refund players if cancelled |

### Accounts (Storage)

| Account | Purpose |
|---------|---------|
| `Tournament` | Tournament metadata (name, entry fee, status, etc.) |
| `VaultAuthority` | Controls vault permissions |
| `VaultToken` | Stores entry fees and prize pool |
| `PlayerEntry` | Tracks which players registered |

### Program-Derived Addresses (PDAs)

```
Tournament:      [b"tournament", tournament_id]
VaultAuthority:  [b"vault-authority", tournament_key]
VaultToken:      [b"vault-token", tournament_key]
PlayerEntry:     [b"player-entry", tournament_key, player_key]
```

## Frontend (React + Vite)

### Pages

- **Tournament List** - Shows all tournaments with filtering & search
- **Create Tournament** - Form to create new tournament
- **Tournament Details** - Register players, start, submit results, distribute prizes

### Components

- **Navigation** - Header with logo and menu
- **Tournament Card** - Display tournament with game image and status
- **Forms** - Create tournament, register player, submit results
- **Wallet Connect** - Phantom wallet integration

### State Management

- React hooks (useState) for local state
- LocalStorage for tournament persistence
- Wallet context from @solana/wallet-adapter

## Data Flow

### Creating Tournament
```
User inputs → Form validation → Build transaction
→ Phantom signs → Send to devnet → Smart contract creates PDA
→ Store in localStorage → Display on UI
```

### Registering Player
```
User selects tournament → Enters player address → Build transaction
→ Phantom signs → Send to devnet → Smart contract updates PlayerEntry
→ Update UI
```

### Distributing Prizes
```
User clicks distribute → Build transaction with winner addresses & amounts
→ Phantom signs → Send to devnet → Smart contract transfers SOL via direct
lamport manipulation → Update tournament status → Display confirmation
```

## Key Technical Details

### PDA Ownership

**Vault PDA (space=0):**
- Owned by System Program (not our smart contract)
- Reason: Cheaper to create, only stores SOL
- Transfer method: Direct lamport manipulation (not CPI)

```rust
**vault_account.try_borrow_mut_lamports()? -= amount;
**recipient.try_borrow_mut_lamports()? += amount;
```

### Tournament Status Flow

```
Registration → Active → Ended → Completed
```

### Fee Model

- Entry fee paid in SOL
- Prize pool = (entry fee × number of players)
- Prizes distributed equally or by winner specification

## Testing Flow

1. **Create Tournament** - Tournament admin creates tournament
2. **Register Players** - Multiple wallets register and pay
3. **Start Tournament** - After start time, admin starts
4. **Submit Results** - Admin declares winners
5. **Distribute Prizes** - Auto-transfer SOL to winners

## Deployment Architecture

```
┌─────────────────────┐
│   User Browser      │
│  (React Frontend)   │
└──────────┬──────────┘
           │
           │ HTTPS
           ↓
┌─────────────────────┐
│  Solana RPC Node    │
│  (api.devnet)       │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Smart Contract     │
│  (Program on chain) │
└─────────────────────┘
```

## Security Considerations

- ✅ PDA seed validation prevents unauthorized access
- ✅ Admin checks prevent non-operators from creating tournaments
- ✅ Wallet signing ensures transaction authenticity
- ✅ No centralized backend (direct smart contract interaction)
- ⚠️ Devnet only (not audited for mainnet)

## Future Improvements

- Prediction markets on game events
- Integration with esports APIs
- Automated tournament scheduling
- Leaderboards and player profiles
- Revenue sharing for tournament operators
