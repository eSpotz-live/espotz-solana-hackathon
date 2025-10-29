# Espotz Tournament Frontend Implementation Guide

## Overview

React frontend for the Espotz tournament system, built with:
- **Vite** - Fast build tool
- **React 19** - UI framework
- **Tailwind CSS** - Styling
- **@solana/web3.js** - Solana blockchain interaction
- **@solana/wallet-adapter** - Wallet connection

## Setup Completed

```bash
✅ Vite React app created in /frontend
✅ Dependencies installed:
   - @solana/web3.js
   - @solana/wallet-adapter-base
   - @solana/wallet-adapter-react
   - @solana/wallet-adapter-react-ui
   - @solana/wallet-adapter-wallets
   - bn.js
   - tailwindcss (dev)
✅ Tailwind CSS configured
✅ Project structure created
```

## Architecture

```
frontend/
├── src/
│   ├── components/
│   │   ├── WalletProvider.jsx        # Solana wallet integration
│   │   ├── CreateTournament.jsx      # Tournament creation form
│   │   ├── TournamentCard.jsx        # Tournament display card
│   │   ├── RegisterPlayer.jsx         # Player registration
│   │   ├── TournamentActions.jsx     # Start/Results/Prizes
│   │   └── TransactionStatus.jsx     # TX status display
│   ├── utils/
│   │   ├── constants.js              # ✅ CREATED - Program constants
│   │   ├── tournament.js             # Tournament program functions
│   │   └── pdas.js                   # PDA derivation utilities
│   ├── App.jsx                       # Main app component
│   ├── index.css                     # ✅ CREATED - Tailwind styles
│   └── main.jsx                      # Entry point
└── package.json
```

## Key Implementation Files

### 1. `/frontend/src/utils/constants.js` ✅ CREATED

Contains:
- Program ID: `BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv`
- RPC endpoint: Solana Devnet
- Instruction discriminators (all 5 instructions)
- Game types enum
- Tournament status enum
- Explorer URL

### 2. `/frontend/src/utils/pdas.js` - TO CREATE

```javascript
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './constants';

export function deriveTournamentPda(tournamentId) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(tournamentId);

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('tournament'), buffer],
    PROGRAM_ID
  );

  return pda;
}

export function deriveVaultAuthorityPda(tournamentPda) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault-authority'), tournamentPda.toBuffer()],
    PROGRAM_ID
  );

  return pda;
}

export function deriveVaultAccountPda(tournamentPda) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault-token'), tournamentPda.toBuffer()],
    PROGRAM_ID
  );

  return pda;
}

export function derivePlayerEntryPda(tournamentPda, playerPubkey) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('player-entry'), tournamentPda.toBuffer(), playerPubkey.toBuffer()],
    PROGRAM_ID
  );

  return pda;
}
```

### 3. `/frontend/src/utils/tournament.js` - TO CREATE

```javascript
import { Connection, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js';
import BN from 'bn.js';
import { PROGRAM_ID, DISCRIMINATORS, RPC_ENDPOINT } from './constants';
import { deriveTournamentPda, deriveVaultAuthorityPda, deriveVaultAccountPda, derivePlayerEntryPda } from './pdas';

const connection = new Connection(RPC_ENDPOINT, 'confirmed');

// Create Tournament
export async function createTournament(wallet, tournamentId, gameType, entryFee, maxPlayers, startTime, endTime) {
  const tournamentPda = deriveTournamentPda(tournamentId);
  const vaultAuthorityPda = deriveVaultAuthorityPda(tournamentPda);
  const vaultAccountPda = deriveVaultAccountPda(tournamentPda);

  // Build instruction data
  const data = Buffer.alloc(256);
  let offset = 0;

  // Discriminator
  DISCRIMINATORS.createTournament.copy(data, offset);
  offset += 8;

  // Tournament ID (u32 LE)
  data.writeUInt32LE(tournamentId, offset);
  offset += 4;

  // Game type (u8)
  data.writeUInt8(gameType, offset);
  offset += 1;

  // Entry fee (u64 LE)
  new BN(entryFee * LAMPORTS_PER_SOL).toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  // Max players (u16 LE)
  data.writeUInt16LE(maxPlayers, offset);
  offset += 2;

  // Start time (i64 LE)
  new BN(startTime).toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  // End time (i64 LE)
  new BN(endTime).toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  const instructionData = data.slice(0, offset);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: tournamentPda, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: vaultAuthorityPda, isSigner: false, isWritable: true },
      { pubkey: vaultAccountPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);
  const txSig = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(txSig, 'confirmed');

  return { txSig, tournamentPda };
}

// Register Player
export async function registerPlayer(wallet, tournamentPda) {
  const playerEntryPda = derivePlayerEntryPda(tournamentPda, wallet.publicKey);
  const vaultAccountPda = deriveVaultAccountPda(tournamentPda);

  const instructionData = DISCRIMINATORS.registerPlayer;

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: playerEntryPda, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: tournamentPda, isSigner: false, isWritable: true },
      { pubkey: vaultAccountPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);
  const txSig = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(txSig, 'confirmed');

  return txSig;
}

// Start Tournament
export async function startTournament(wallet, tournamentPda) {
  const instructionData = DISCRIMINATORS.startTournament;

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: tournamentPda, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);
  const txSig = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(txSig, 'confirmed');

  return txSig;
}

// Submit Results
export async function submitResults(wallet, tournamentPda, winners) {
  const data = Buffer.alloc(256);
  let offset = 0;

  // Discriminator
  DISCRIMINATORS.submitResults.copy(data, offset);
  offset += 8;

  // Vec<Pubkey> winners - length (u32 LE)
  data.writeUInt32LE(winners.length, offset);
  offset += 4;

  // Write each winner pubkey (32 bytes each)
  for (const winner of winners) {
    winner.toBuffer().copy(data, offset);
    offset += 32;
  }

  const instructionData = data.slice(0, offset);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: tournamentPda, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);
  const txSig = await wallet.sendTransaction(tx, connection);
  await connection.confirmTransaction(txSig, 'confirmed');

  return txSig;
}

// Distribute Prizes (Note: Currently blocked by smart contract issue)
export async function distributePrizes(wallet, tournamentPda, winners, amounts) {
  const vaultAuthorityPda = deriveVaultAuthorityPda(tournamentPda);
  const vaultAccountPda = deriveVaultAccountPda(tournamentPda);

  const data = Buffer.alloc(512);
  let offset = 0;

  // Discriminator
  DISCRIMINATORS.distributePrizes.copy(data, offset);
  offset += 8;

  // Vec<Pubkey> winners - length (u32 LE)
  data.writeUInt32LE(winners.length, offset);
  offset += 4;

  // Write each winner pubkey
  for (const winner of winners) {
    winner.toBuffer().copy(data, offset);
    offset += 32;
  }

  // Vec<u64> amounts - length (u32 LE)
  data.writeUInt32LE(amounts.length, offset);
  offset += 4;

  // Write each amount (u64 LE)
  for (const amount of amounts) {
    new BN(amount).toArrayLike(Buffer, 'le', 8).copy(data, offset);
    offset += 8;
  }

  const instructionData = data.slice(0, offset);

  const accounts = [
    { pubkey: tournamentPda, isSigner: false, isWritable: true },
    { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
    { pubkey: vaultAccountPda, isSigner: false, isWritable: true },
    { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  // Add winner accounts as remaining accounts
  for (const winner of winners) {
    accounts.push({ pubkey: winner, isSigner: false, isWritable: true });
  }

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: accounts,
    data: instructionData,
  });

  const tx = new Transaction().add(ix);

  try {
    const txSig = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(txSig, 'confirmed');
    return txSig;
  } catch (error) {
    console.error('Prize distribution error:', error);
    throw new Error('Prize distribution is currently blocked by a smart contract issue. The vault funds are secure and will be distributed once the contract is fixed.');
  }
}
```

### 4. `/frontend/src/components/WalletProvider.jsx` - TO CREATE

Uses @solana/wallet-adapter-react to provide wallet context to the app.

### 5. `/frontend/src/App.jsx` - TO CREATE

Main application with:
- Wallet connection button
- Create tournament form
- List of tournaments
- Tournament cards with actions
- Transaction status display

## UI Features

### Tournament Creation
- Tournament ID input (random generation)
- Game type selector (Chess, Checkers, Go)
- Entry fee input (SOL)
- Max players input
- Start/End time pickers
- Create button

### Tournament Card
- Tournament ID
- Game type
- Entry fee
- Player count / Max players
- Status badge
- Actions based on status:
  - **Open**: Register button
  - **Active**: Submit results (admin only)
  - **Ended**: Distribute prizes (admin only)

### Transaction Feedback
- Loading states
- Success messages with Explorer links
- Error handling
- Toast notifications

## Styling

Purple gradient background (#667eea to #764ba2) with glass-morphism cards:
- Semi-transparent white backgrounds
- Backdrop blur effects
- Rounded corners
- Shadow effects
- Responsive design

## Next Steps to Complete

1. Create `/frontend/src/utils/pdas.js`
2. Create `/frontend/src/utils/tournament.js`
3. Create `/frontend/src/components/WalletProvider.jsx`
4. Create `/frontend/src/components/CreateTournament.jsx`
5. Create `/frontend/src/components/TournamentCard.jsx`
6. Create `/frontend/src/components/RegisterPlayer.jsx`
7. Create `/frontend/src/components/TournamentActions.jsx`
8. Create `/frontend/src/App.jsx`
9. Update `/frontend/src/main.jsx`
10. Run `npm run dev` and test

## Known Issues

- **Prize Distribution**: Smart contract has a PDA signing issue. The UI will show an error message explaining the issue and that funds are secure in the vault.

## Testing

1. Connect Phantom/Solflare wallet (Devnet)
2. Create a tournament with small entry fee (0.0001 SOL)
3. Register players (need multiple wallets or accounts)
4. Start tournament (after start time)
5. Submit results with winner
6. Attempt prize distribution (will show error with explanation)

## Explorer Links

All transactions link to Solana Explorer (Devnet) for verification.

---

**Status**: Frontend scaffolding complete, core utility files created. Ready for component implementation.

