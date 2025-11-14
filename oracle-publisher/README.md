# Tournament Oracle Publisher

Off-chain oracle service for publishing verified tournament results to the Solana blockchain.

## Overview

This oracle publisher signs tournament results using Ed25519 cryptography and submits them to the tournament smart contract for verification. The smart contract validates the oracle's signature before distributing prizes to winners.

## Architecture

1. **Oracle Signer**: Creates Ed25519 signatures for tournament results
2. **Result Publisher**: Submits signed results to the blockchain
3. **Smart Contract Verification**: On-chain validation of oracle signatures

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Oracle Keypair

```bash
node src/oracle-signer.js
```

This will generate a new Ed25519 keypair. Save the secret key securely!

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your configuration:

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `ORACLE_SECRET_KEY`: Your generated oracle secret key
- `TOURNAMENT_PUBKEY`: The tournament you want to publish results for
- `WALLET_PATH`: Path to your Solana wallet

### 4. Initialize Oracle for Tournament

Before first use, initialize the oracle for your tournament:

```bash
INITIALIZE_ORACLE=true node src/publish-result.js
```

### 5. Publish Tournament Results

```bash
node src/publish-result.js
```

## Usage

### Initialize Oracle

```javascript
import { OracleResultPublisher } from './src/publish-result.js';
import { OracleSigner } from './src/oracle-signer.js';

const oracleSigner = new OracleSigner(process.env.ORACLE_SECRET_KEY);
const publisher = new OracleResultPublisher(connection, wallet, program, oracleSigner);

await publisher.initializeOracle(tournamentPubkey, oracleQueuePubkey);
```

### Publish Result

```javascript
const winners = [winnerPubkey1, winnerPubkey2];
const amounts = [5000000, 3000000]; // In lamports

await publisher.publishResult(
  tournamentPubkey,
  winners,
  amounts,
  authorityPubkey
);
```

## How It Works

### 1. Sign Tournament Result

The oracle creates a message containing:
- Tournament public key (32 bytes)
- Timestamp (8 bytes)
- Number of winners (1 byte)
- Winner public keys (32 bytes each)
- Prize amounts (8 bytes each)

This message is signed using Ed25519.

### 2. Create Ed25519 Verification Instruction

An Ed25519Program instruction is created containing:
- Oracle's public key
- Signature
- Original message

### 3. Submit Transaction

A transaction is created with TWO instructions:
1. Ed25519 signature verification instruction
2. `distribute_prizes_oracle` instruction

The smart contract loads the Ed25519 instruction from the sysvar and verifies it matches the oracle authority.

### 4. Prize Distribution

If verification succeeds, prizes are distributed to winners from the tournament vault.

## Security

- **Private Key Security**: Keep your `ORACLE_SECRET_KEY` secure. Anyone with this key can publish tournament results.
- **Oracle Authority**: The oracle public key must be initialized in the tournament oracle account.
- **On-Chain Verification**: All signatures are verified on-chain using Solana's Ed25519Program.

## Testing

You can test the oracle publisher on devnet:

```bash
# Generate keypair
node src/oracle-signer.js

# Initialize oracle
INITIALIZE_ORACLE=true TOURNAMENT_PUBKEY=<your_tournament> node src/publish-result.js

# Publish result
TOURNAMENT_PUBKEY=<your_tournament> WINNER1_PUBKEY=<winner> node src/publish-result.js
```

## Integration with Switchboard

While this implementation uses direct Ed25519 signatures, it can be enhanced to integrate with Switchboard's oracle network:

1. Switchboard oracles can use this signing mechanism
2. Multiple oracles can sign the same result
3. The smart contract can require M-of-N signatures for added security

## API Reference

### OracleSigner

```javascript
const signer = new OracleSigner(secretKey);
```

Methods:
- `signTournamentResult(result)`: Sign tournament result data
- `createEd25519Instruction(signature, message, publicKey)`: Create verification instruction
- `static generateKeypair()`: Generate new oracle keypair

### OracleResultPublisher

```javascript
const publisher = new OracleResultPublisher(connection, wallet, program, oracleSigner);
```

Methods:
- `initializeOracle(tournamentPubkey, oracleQueuePubkey)`: Initialize oracle for tournament
- `publishResult(tournamentPubkey, winners, amounts, authority)`: Publish signed result

## Troubleshooting

### "Oracle not initialized"
Run the initialization step first with `INITIALIZE_ORACLE=true`.

### "Invalid oracle"
Ensure the oracle public key in your environment matches the one initialized in the tournament.

### "Oracle verification failed"
Check that the Ed25519 instruction is being created correctly and included in the transaction.

## License

MIT
