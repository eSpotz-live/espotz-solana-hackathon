import { Connection, Transaction, TransactionInstruction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
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
      { pubkey: vaultAuthorityPda, isSigner: false, isWritable: true },
      { pubkey: vaultAccountPda, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;

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
      { pubkey: tournamentPda, isSigner: false, isWritable: true },
      { pubkey: playerEntryPda, isSigner: false, isWritable: true },
      { pubkey: vaultAccountPda, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;

  try {
    const txSig = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(txSig, 'confirmed');
    return txSig;
  } catch (error) {
    console.error('Register player error details:', error);
    if (error.logs) console.error('Program logs:', error.logs);

    // Check for specific error messages
    if (error.message.includes('insufficient funds') || error.message.includes('InsufficientFunds')) {
      throw new Error('Insufficient funds. You need enough SOL for entry fee + transaction fee + account rent (~0.003 SOL total).');
    }
    if (error.message.includes('already registered')) {
      throw new Error('You are already registered for this tournament.');
    }

    throw new Error(`Failed to register: ${error.message}`);
  }
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
  tx.feePayer = wallet.publicKey;

  try {
    const txSig = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(txSig, 'confirmed');
    return txSig;
  } catch (error) {
    console.error('Start tournament error details:', error);
    if (error.logs) console.error('Program logs:', error.logs);
    throw new Error(`Failed to start tournament: ${error.message}`);
  }
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
  tx.feePayer = wallet.publicKey;

  try {
    const txSig = await wallet.sendTransaction(tx, connection);
    await connection.confirmTransaction(txSig, 'confirmed');
    return txSig;
  } catch (error) {
    console.error('Submit results error details:', error);
    if (error.logs) console.error('Program logs:', error.logs);

    // Check for specific error messages
    if (error.message.includes('TournamentNotEnded')) {
      throw new Error('Tournament has not ended yet. Wait until the end time has passed.');
    }
    if (error.message.includes('Unauthorized')) {
      throw new Error('Only the tournament admin can submit results.');
    }
    if (error.message.includes('InvalidTournamentStatus')) {
      throw new Error('Tournament must be in Active status to submit results.');
    }

    throw new Error(`Failed to submit results: ${error.message}`);
  }
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
