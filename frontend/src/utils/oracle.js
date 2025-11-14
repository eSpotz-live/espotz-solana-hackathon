import { Connection, Transaction, TransactionInstruction, SystemProgram, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import BN from 'bn.js';
import { PROGRAM_ID, DISCRIMINATORS, RPC_ENDPOINT } from './constants';
import { deriveTournamentOraclePda, deriveVaultAuthorityPda, deriveVaultAccountPda } from './pdas';

const connection = new Connection(RPC_ENDPOINT, 'confirmed');

// Oracle Public Key - This should be the same as the one used in the oracle publisher
// In production, this would be fetched from the tournament oracle account
export const DEFAULT_ORACLE_PUBKEY = new PublicKey('GGYMFqaH79GYgYX67QgFJwq7j3G5z1KknzkLzEDHRDHu');

/**
 * Initialize Oracle for a Tournament
 * This must be called by the tournament admin after creating a tournament
 */
export async function initializeOracle(wallet, tournamentPda, oracleFeedPubkey = DEFAULT_ORACLE_PUBKEY) {
  const tournamentOraclePda = deriveTournamentOraclePda(tournamentPda);

  // Use default oracle queue (PublicKey.default / all zeros)
  const oracleQueuePubkey = PublicKey.default;

  const instructionData = DISCRIMINATORS.initializeOracle;

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: tournamentPda, isSigner: false, isWritable: false },
      { pubkey: tournamentOraclePda, isSigner: false, isWritable: true },
      { pubkey: oracleFeedPubkey, isSigner: false, isWritable: false },
      { pubkey: oracleQueuePubkey, isSigner: false, isWritable: false },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;

  try {
    const txSig = await wallet.sendTransaction(tx, connection, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
    console.log('Initialize oracle transaction sent:', txSig);

    await connection.confirmTransaction(txSig, 'confirmed');
    console.log('Oracle initialized successfully');

    return { txSig, tournamentOraclePda };
  } catch (error) {
    console.error('Initialize oracle error:', error);
    if (error.logs) console.error('Program logs:', error.logs);
    throw new Error(`Failed to initialize oracle: ${error.message}`);
  }
}

/**
 * Distribute Prizes with Oracle Verification
 * This function is meant to be called by the oracle service, not directly from the frontend
 * It requires the oracle's Ed25519 signature which can only be created by the oracle service
 *
 * For frontend use, this is a placeholder that shows what the oracle service will call
 */
export async function distributePrizesWithOracle(wallet, tournamentPda, winners, amounts) {
  console.warn('⚠️ This function requires oracle signature verification.');
  console.warn('   Prize distribution with oracle must be done through the oracle publisher service.');
  console.warn('   See: /oracle-publisher/src/publish-result.js');

  throw new Error(
    'Oracle-based prize distribution must be performed by the oracle publisher service. ' +
    'This requires Ed25519 signature verification which can only be created by the oracle service holding the private key.'
  );
}

/**
 * Check if a tournament has oracle initialized
 */
export async function checkOracleInitialized(tournamentPda) {
  try {
    const tournamentOraclePda = deriveTournamentOraclePda(tournamentPda);
    const accountInfo = await connection.getAccountInfo(tournamentOraclePda);

    return {
      initialized: accountInfo !== null,
      oraclePda: tournamentOraclePda,
      accountInfo
    };
  } catch (error) {
    console.error('Error checking oracle status:', error);
    return {
      initialized: false,
      oraclePda: deriveTournamentOraclePda(tournamentPda),
      error: error.message
    };
  }
}

/**
 * Get Oracle Account Data
 */
export async function getOracleAccountData(tournamentPda) {
  try {
    const tournamentOraclePda = deriveTournamentOraclePda(tournamentPda);
    const accountInfo = await connection.getAccountInfo(tournamentOraclePda);

    if (!accountInfo) {
      return null;
    }

    // Parse oracle account data
    // Structure: tournament (32) + oracle_feed (32) + oracle_queue (32) + is_initialized (1) +
    //            last_verification_timestamp (8) + verified_winner (32) + bump (1)
    const data = accountInfo.data;

    return {
      tournament: new PublicKey(data.slice(8, 40)),
      oracleFeed: new PublicKey(data.slice(40, 72)),
      oracleQueue: new PublicKey(data.slice(72, 104)),
      isInitialized: data[104] === 1,
      lastVerificationTimestamp: new BN(data.slice(105, 113), 'le').toNumber(),
      verifiedWinner: new PublicKey(data.slice(113, 145)),
      bump: data[145],
    };
  } catch (error) {
    console.error('Error getting oracle account data:', error);
    return null;
  }
}
