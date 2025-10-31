# Espotz - Decentralized Esports Tournament Platform

A blockchain-powered tournament platform where users create esports tournaments, register players, submit results, and automatically distribute prizes on Solana.

## Features

✅ Create tournaments for 8 game types (League of Legends, Valorant, CS:GO, etc.)
✅ Register players with entry fees (stored in vault)
✅ Submit results and determine winners
✅ Automatically distribute prizes to winners
✅ Tournament filtering (Upcoming, Live, Completed)
✅ Search tournaments by game or ID
✅ Phantom wallet integration
✅ Dark theme responsive UI

## Tech Stack

- **Smart Contract:** Rust + Anchor Framework 0.32
- **Frontend:** React 19 + Vite 7 + Tailwind CSS
- **Blockchain:** Solana Devnet
- **Wallet:** @solana/wallet-adapter (Phantom/Solflare)

## Quick Start

### Run Frontend (Already Deployed)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173/ in browser

### To Redeploy Smart Contract

```bash
anchor build
anchor deploy
```

Program deployed at: `BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv`

## How It Works

1. **Create Tournament** → Smart contract creates tournament account
2. **Register Players** → Players send SOL, stored in vault
3. **Start Tournament** → Admin marks tournament as active
4. **Submit Results** → Admin declares winners
5. **Distribute Prizes** → Smart contract sends SOL to winners

**Key Innovation:** Prize distribution uses direct lamport manipulation (not CPI) because the vault is System Program-owned. See `PRIZE_DISTRIBUTION_FIX.md` for technical details.

## Project Structure

```
espotz-solana/
├── programs/tournament/      # Smart contract (Rust)
│   └── src/
│       ├── lib.rs            # Entry point
│       ├── instructions/      # Functions (create, register, start, submit, distribute)
│       ├── state.rs          # Account structures
│       └── errors.rs         # Error types
├── frontend/                 # React UI
│   ├── src/
│   │   ├── App.jsx
│   │   └── utils/
│   └── public/               # Game images
└── PRIZE_DISTRIBUTION_FIX.md # Technical deep-dive
```

## Key Technical Decision

**Lamport Manipulation for Prize Distribution:**

The vault PDA is created with `space=0`, making it System Program-owned. This means:
- ❌ Cannot use CPI to transfer SOL (would fail with `ExternalAccountLamportSpend`)
- ✅ Must use direct lamport manipulation instead

```rust
**vault_account.try_borrow_mut_lamports()? -= amount;
**winner_account.try_borrow_mut_lamports()? += amount;
```

This approach works because the program has signing authority over the PDA through seed derivation.

## Documentation

- **DEPLOYMENT.md** - Setup and deployment instructions
- **ARCHITECTURE.md** - System design overview
- **PRIZE_DISTRIBUTION_FIX.md** - Technical analysis of PDA ownership & lamport transfers

## Next Steps

1. Install dependencies: `cd frontend && npm install`
2. Start dev server: `npm run dev`
3. Open http://localhost:5173/
4. Connect Phantom wallet with devnet SOL
5. Create a tournament and test all features
