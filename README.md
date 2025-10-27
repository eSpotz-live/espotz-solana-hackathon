# Espotz Tournament Platform - Solana Implementation

A decentralized esports tournament platform built on Solana, enabling tournament operators to create and manage competitions with USDC entry fees and prize distribution.

## Project Structure

```
espotz-solana/
├── programs/               # Solana smart contracts (Rust + Anchor)
│   └── tournament/        # Main tournament program
│       └── src/
│           ├── lib.rs            # Entry point
│           ├── state/            # Account structures
│           ├── instructions/     # Instruction handlers
│           └── errors.rs         # Custom errors
├── tests/                 # Smart contract tests (TypeScript)
├── app/                   # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # Wallet & program contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Generated Anchor client
│   │   └── pages/        # Page components
│   └── public/
├── target/                # Build artifacts
└── Anchor.toml           # Anchor configuration
```

## Prerequisites

Before starting, ensure you have:
- **Node.js** 18+ and npm/yarn
- **Rust** 1.75+ (already installed)
- **Solana CLI** (we'll install this)
- **Anchor Framework** (we'll install this)

## Quick Start

### 1. Install Development Tools

Run the setup script:

```bash
cd /home/user/Desktop/claude/espotz-solana
./setup.sh
```

Or install manually:

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Configure for devnet
solana config set --url devnet
```

### 2. Generate Wallet

```bash
# Create new wallet
solana-keygen new --outfile ~/.config/solana/id.json

# Get devnet SOL (needed for deployment)
solana airdrop 5
```

### 3. Build Smart Contract

```bash
# Build the program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy
```

### 4. Run Frontend

```bash
cd app
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Architecture

### Smart Contract Components

**Accounts (State Storage):**
- `Tournament` - Tournament metadata and state
- `PlayerEntry` - Individual player registration records
- `PrizeVault` - USDC escrow account
- `VaultAuthority` - PDA controlling vault

**Instructions (Functions):**
- `create_tournament` - Create new tournament
- `register_player` - Register and pay entry fee
- `submit_results` - Operator submits results
- `distribute_prizes` - Pay winners
- `cancel_tournament` - Cancel and enable refunds
- `claim_refund` - Players claim refunds if cancelled

**PDAs (Program Derived Addresses):**
- Tournament: `["tournament", tournament_id]`
- Player Entry: `["player-entry", tournament, player]`
- Prize Vault: `["prize-vault", tournament]`
- Vault Authority: `["vault-authority", tournament]`

### Frontend Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Solana Wallet Adapter** - Wallet integration
- **Anchor Client** - Generated from IDL

## Development Workflow

### Smart Contract Development

```bash
# Make changes to programs/tournament/src/

# Rebuild
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy
```

### Frontend Development

```bash
cd app

# Start dev server
npm run dev

# Build for production
npm run build
```

### Testing on Devnet

1. Ensure wallet has devnet SOL:
   ```bash
   solana balance
   solana airdrop 2  # if needed
   ```

2. Deploy program:
   ```bash
   anchor deploy
   ```

3. Update frontend with program ID:
   ```typescript
   // app/src/lib/constants.ts
   export const PROGRAM_ID = "YOUR_DEPLOYED_PROGRAM_ID";
   ```

4. Test in browser with devnet wallet

## Configuration

### Anchor.toml

```toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
tournament = "PROGRAM_ID_HERE"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### Environment Variables

Create `app/.env`:

```env
VITE_RPC_ENDPOINT=https://api.devnet.solana.com
VITE_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
VITE_PROGRAM_ID=YOUR_PROGRAM_ID
```

## USDC Integration

**Devnet USDC Mint:** `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

Get devnet USDC from faucet:
https://faucet.circle.com/

## Deployment

### Devnet Deployment

```bash
# Ensure you're on devnet
solana config set --url devnet

# Build
anchor build

# Deploy
anchor deploy

# Save the program ID shown after deployment
```

### Mainnet Deployment (After Audit)

```bash
# Switch to mainnet
solana config set --url mainnet-beta

# Ensure wallet has SOL (~5 SOL for deployment)
solana balance

# Deploy
anchor deploy

# Initialize IDL on-chain
anchor idl init --filepath target/idl/tournament.json <PROGRAM_ID>
```

## Testing

### Unit Tests

```bash
anchor test
```

### Integration Tests

```bash
cd tests
npm run test:integration
```

### Frontend Tests

```bash
cd app
npm run test
```


## Cost Estimates

**Development (Devnet):**
- Free (use airdropped SOL)

**Mainnet Deployment:**
- Program deployment: ~0.5-2 SOL (~$50-200)
- Security audit: $5,000-15,000
- Monthly operations: $75-150 (RPC, hosting, monitoring)

## Troubleshooting

### "Anchor not found"
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest && avm use latest
```

### "Insufficient funds"
```bash
solana airdrop 5
```

### "Program not found"
```bash
# Rebuild and redeploy
anchor build
anchor deploy
```

### "Transaction simulation failed"
- Check account state (initialized?)
- Verify wallet has USDC
- Check transaction logs: `solana logs`

## Resources

- [Solana Documentation](https://docs.solana.com)
- [Anchor Book](https://book.anchor-lang.com)
- [Solana Cookbook](https://solanacookbook.com)
- [Anchor Examples](https://github.com/coral-xyz/anchor/tree/master/tests)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Anchor/Solana documentation
3. Check transaction logs: `solana logs`
4. Examine account state via Solana Explorer

## License

MIT

## Next Steps

1. Run `./setup.sh` to install tools
2. Generate wallet and airdrop SOL
3. Build smart contract: `anchor build`
4. Run tests: `anchor test`
5. Deploy to devnet: `anchor deploy`
6. Set up frontend: `cd app && npm install`
7. Start development!
