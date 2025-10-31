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

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;

  try {
    const txSig = await wallet.sendTransaction(tx, connection, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3
    });
    console.log('Transaction sent:', txSig);

    const confirmation = await connection.confirmTransaction(txSig, 'confirmed');
    console.log('Transaction confirmed:', confirmation);

    return { txSig, tournamentPda };
  } catch (error) {
    console.error('Create tournament error details:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.logs) {
      console.error('Program logs:', error.logs);
      // Try to extract meaningful error from logs
      const errorLog = error.logs?.find(log => log.includes('Error:') || log.includes('failed'));
      if (errorLog) console.error('Error from logs:', errorLog);
    }
    throw new Error(`Failed to create tournament: ${error.message}`);
  }
}

// Register Player
export async function registerPlayer(wallet, tournamentPda) {
  // Check if tournament account exists
  try {
    const tournamentInfo = await connection.getAccountInfo(tournamentPda);
    if (!tournamentInfo) {
      throw new Error('Tournament account does not exist on-chain. It may have been created in a previous session. Please create a new tournament.');
    }
    console.log('Tournament account found, size:', tournamentInfo.data.length);
  } catch (error) {
    if (error.message.includes('does not exist')) {
      throw error;
    }
    console.error('Error checking tournament account:', error);
  }

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

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;

  // Try to simulate the transaction first to get detailed error info
  try {
    console.log('Simulating transaction...');
    console.log('Tournament PDA:', tournamentPda.toString());
    console.log('Player Entry PDA:', playerEntryPda.toString());
    console.log('Vault Account PDA:', vaultAccountPda.toString());
    console.log('Player Wallet:', wallet.publicKey.toString());

    const simulation = await connection.simulateTransaction(tx);
    console.log('Simulation result:', simulation);

    if (simulation.value.err) {
      console.error('Simulation failed:', simulation.value.err);
      console.error('Simulation logs:', simulation.value.logs);
      throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }
  } catch (simError) {
    console.error('Simulation error:', simError);
    if (simError.message.includes('simulation failed')) {
      throw simError;
    }
    // If simulation itself fails (not the transaction), continue to try sending
    console.warn('Could not simulate, trying to send anyway...');
  }

  try {
    const txSig = await wallet.sendTransaction(tx, connection, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3
    });
    console.log('Transaction sent:', txSig);

    const confirmation = await connection.confirmTransaction(txSig, 'confirmed');
    console.log('Transaction confirmed:', confirmation);

    return txSig;
  } catch (error) {
    console.error('Register player error details:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.logs) {
      console.error('Program logs:', error.logs);
      // Try to extract meaningful error from logs
      const errorLog = error.logs?.find(log => log.includes('Error:') || log.includes('failed') || log.includes('custom program error'));
      if (errorLog) console.error('Error from logs:', errorLog);
    }

    // Try to get transaction error details
    if (error.signature) {
      try {
        const txDetails = await connection.getTransaction(error.signature, {
          maxSupportedTransactionVersion: 0
        });
        console.error('Transaction details:', txDetails);
      } catch (e) {
        console.error('Could not fetch transaction details:', e);
      }
    }

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

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;

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

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;

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
  tx.feePayer = wallet.publicKey;

  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;

  // Simulate transaction first to get detailed error
  try {
    console.log('🧪 Simulating distribute prizes transaction...');
    const simulation = await connection.simulateTransaction(tx);

    if (simulation.value.err) {
      console.error('❌ Simulation failed:', simulation.value.err);
      if (simulation.value.logs) {
        console.error('📝 Program logs:');
        simulation.value.logs.forEach(log => console.error('  ', log));
      }
      throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    console.log('✅ Simulation passed');
    if (simulation.value.logs) {
      console.log('📝 Simulation logs:');
      simulation.value.logs.forEach(log => console.log('  ', log));
    }
  } catch (simError) {
    console.error('Simulation error:', simError);
    throw simError;
  }

  try {
    const txSig = await wallet.sendTransaction(tx, connection, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
    console.log('Transaction sent:', txSig);

    const confirmation = await connection.confirmTransaction(txSig, 'confirmed');
    console.log('Confirmation:', confirmation);

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    return txSig;
  } catch (error) {
    console.error('Prize distribution error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Try to get transaction logs if available
    if (error.signature || error.transactionSignature) {
      const sig = error.signature || error.transactionSignature;
      try {
        const txDetails = await connection.getTransaction(sig, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });
        if (txDetails?.meta?.logMessages) {
          console.error('Transaction logs:', txDetails.meta.logMessages);
        }
      } catch (logError) {
        console.error('Could not fetch transaction logs:', logError);
      }
    }

    throw error;
  }
}
