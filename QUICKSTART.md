# Espotz Tournament Platform - Quick Start Guide

## Step 1: Install Development Tools

Run the setup script:

```bash
cd /home/user/Desktop/claude/espotz-solana
./setup.sh
```

After installation, **restart your terminal** or run:

```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

Verify installations:

```bash
solana --version
anchor --version
```

## Step 2: Generate Wallet

```bash
# Create new wallet (save the seed phrase!)
solana-keygen new --outfile ~/.config/solana/id.json

# View your address
solana address

# Get devnet SOL
solana airdrop 5
```

## Step 3: Build Smart Contract

```bash
# Install dependencies
yarn install

# Build the program
anchor build

# Update the program ID
# After first build, copy the program ID from target/deploy/tournament-keypair.json
# and update it in lib.rs declare_id! macro

# Rebuild after updating ID
anchor build
```

## Step 4: Run Tests

```bash
# Run all tests
anchor test

# Or run with logs
anchor test -- --features "test-bpf"
```

## Step 5: Deploy to Devnet

```bash
# Configure for devnet
solana config set --url devnet

# Check balance (need ~2-5 SOL for deployment)
solana balance

# If needed, airdrop more
solana airdrop 2

# Deploy
anchor deploy

# Save the program ID shown after deployment
```

## Step 6: Set Up Frontend

```bash
cd app
npm install
npm run dev
```

Visit http://localhost:5173

## Common Commands

### Smart Contract

```bash
anchor build          # Build program
anchor test           # Run tests
anchor deploy         # Deploy to configured network
anchor upgrade        # Upgrade existing program
solana logs           # Watch transaction logs
```

### Frontend

```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run linter
```

### Solana CLI

```bash
solana config set --url devnet      # Switch to devnet
solana config set --url localnet    # Switch to local
solana config set --url mainnet-beta # Switch to mainnet

solana address                      # Show wallet address
solana balance                      # Check balance
solana airdrop 2                    # Get devnet SOL

solana program show <PROGRAM_ID>    # View program info
```

## Development Workflow

1. Make changes to `programs/tournament/src/`
2. Run `anchor build`
3. Run `anchor test` to verify
4. Deploy with `anchor deploy`
5. Update frontend with new program ID
6. Test in browser

## Troubleshooting

### "Anchor not found"

```bash
avm install latest
avm use latest
```

### "Insufficient funds"

```bash
solana airdrop 5
```

### "Program not found"

Make sure you've deployed and updated the program ID in:
- `programs/tournament/src/lib.rs` (declare_id!)
- `Anchor.toml` (programs section)
- `app/src/lib/constants.ts` (frontend)

### "Transaction simulation failed"

Check the logs:
```bash
solana logs
```

Common issues:
- Account not initialized
- Insufficient USDC balance
- Invalid account constraints

## Next Steps

1. Deploy to devnet
2. Test all features in browser
3. Get devnet USDC from faucet: https://faucet.circle.com/
4. Conduct security audit
5. Deploy to mainnet

## Resources

- [Solana Docs](https://docs.solana.com)
- [Anchor Book](https://book.anchor-lang.com)
- [SPL Token Guide](https://spl.solana.com/token)
