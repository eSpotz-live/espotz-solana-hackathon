import * as web3 from '@solana/web3.js';
import anchor from '@coral-xyz/anchor';
const { BN, AnchorProvider, Program, Wallet } = anchor;
import { OracleSigner } from './src/oracle-signer.js';
import { OracleResultPublisher } from './src/publish-result.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

/**
 * End-to-End Test Script for Oracle Integration
 *
 * This script tests the complete oracle flow:
 * 1. Create a tournament
 * 2. Initialize oracle for the tournament
 * 3. Register players
 * 4. Start tournament
 * 5. Submit results (end tournament)
 * 6. Distribute prizes with oracle verification
 */

async function main() {
  console.log('🧪 Starting Oracle Integration E2E Test\n');

  // Setup connection
  const connection = new web3.Connection(
    web3.clusterApiUrl('devnet'),
    'confirmed'
  );

  // Load wallet
  const walletPath = process.env.WALLET_PATH || path.join(process.env.HOME, '.config/solana/id.json');
  const walletKeypair = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );

  console.log('🔑 Wallet:', walletKeypair.publicKey.toString());

  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log('💰 Balance:', balance / web3.LAMPORTS_PER_SOL, 'SOL\n');

  // Load oracle signer
  const oracleSigner = new OracleSigner(process.env.ORACLE_SECRET_KEY);
  console.log('🔮 Oracle Public Key:', oracleSigner.publicKey.toString(), '\n');

  // Load program
  const idlPath = path.join(__dirname, '../target/idl/tournament.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  const programId = new web3.PublicKey(idl.address);

  const provider = new AnchorProvider(
    connection,
    new Wallet(walletKeypair),
    { commitment: 'confirmed' }
  );

  const program = new Program(idl, provider);

  console.log('📋 Program ID:', programId.toString(), '\n');

  // ========================================
  // Step 1: Create Tournament
  // ========================================
  console.log('📝 Step 1: Creating Tournament...');

  const tournamentId = Math.floor(Math.random() * 1000000);
  const entryFee = 0.001 * web3.LAMPORTS_PER_SOL; // 0.001 SOL
  const maxPlayers = 4;
  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 10; // Start in 10 seconds (allow time for player registration)
  const endTime = now + 20; // End in 20 seconds (for testing)

  // Create tournament ID as u32 little-endian bytes
  const tournamentIdBuffer = Buffer.alloc(4);
  tournamentIdBuffer.writeUInt32LE(tournamentId);

  const [tournamentPda, tournamentBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('tournament'), tournamentIdBuffer],
    programId
  );

  const [vaultAuthorityPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('vault-authority'), tournamentPda.toBuffer()],
    programId
  );

  const [vaultPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('vault-token'), tournamentPda.toBuffer()],
    programId
  );

  try {
    const tx = await program.methods
      .createTournament(
        tournamentId,
        { fortnite: {} }, // GameType enum
        new BN(entryFee),
        maxPlayers,
        new BN(startTime),
        new BN(endTime)
      )
      .accounts({
        tournament: tournamentPda,
        vaultAuthority: vaultAuthorityPda,
        vaultAccount: vaultPda,
        admin: walletKeypair.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log('✅ Tournament created!');
    console.log('   Tournament ID:', tournamentId);
    console.log('   Tournament PDA:', tournamentPda.toString());
    console.log('   Transaction:', tx, '\n');
  } catch (error) {
    console.error('❌ Error creating tournament:', error.message);
    process.exit(1);
  }

  // ========================================
  // Step 2: Initialize Oracle
  // ========================================
  console.log('📝 Step 2: Initializing Oracle...');

  const [tournamentOraclePda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('tournament-oracle'), tournamentPda.toBuffer()],
    programId
  );

  try {
    const tx = await program.methods
      .initializeOracle()
      .accounts({
        tournament: tournamentPda,
        tournamentOracle: tournamentOraclePda,
        oracleFeed: oracleSigner.publicKey,
        oracleQueue: web3.PublicKey.default,
        admin: walletKeypair.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log('✅ Oracle initialized!');
    console.log('   Oracle PDA:', tournamentOraclePda.toString());
    console.log('   Oracle Authority:', oracleSigner.publicKey.toString());
    console.log('   Transaction:', tx, '\n');
  } catch (error) {
    console.error('❌ Error initializing oracle:', error.message);
    process.exit(1);
  }

  // ========================================
  // Step 3: Register Players
  // ========================================
  console.log('📝 Step 3: Registering Players...');

  // Create test player accounts
  const player1 = web3.Keypair.generate();
  const player2 = web3.Keypair.generate();

  // Fund players from wallet for entry fees
  console.log('   Funding players from wallet...');
  const fundTx1 = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: walletKeypair.publicKey,
      toPubkey: player1.publicKey,
      lamports: 0.01 * web3.LAMPORTS_PER_SOL,
    })
  );
  const fundTx2 = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: walletKeypair.publicKey,
      toPubkey: player2.publicKey,
      lamports: 0.01 * web3.LAMPORTS_PER_SOL,
    })
  );
  await web3.sendAndConfirmTransaction(connection, fundTx1, [walletKeypair]);
  await web3.sendAndConfirmTransaction(connection, fundTx2, [walletKeypair]);
  console.log('   Players funded!');

  // Register player 1
  const [player1EntryPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('player-entry'), tournamentPda.toBuffer(), player1.publicKey.toBuffer()],
    programId
  );

  try {
    const tx = await program.methods
      .registerPlayer()
      .accounts({
        tournament: tournamentPda,
        playerEntry: player1EntryPda,
        vaultAccount: vaultPda,
        player: player1.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([player1])
      .rpc();

    console.log('✅ Player 1 registered:', player1.publicKey.toString());
  } catch (error) {
    console.error('❌ Error registering player 1:', error.message);
  }

  // Register player 2
  const [player2EntryPda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('player-entry'), tournamentPda.toBuffer(), player2.publicKey.toBuffer()],
    programId
  );

  try {
    const tx = await program.methods
      .registerPlayer()
      .accounts({
        tournament: tournamentPda,
        playerEntry: player2EntryPda,
        vaultAccount: vaultPda,
        player: player2.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([player2])
      .rpc();

    console.log('✅ Player 2 registered:', player2.publicKey.toString());
  } catch (error) {
    console.error('❌ Error registering player 2:', error.message);
  }

  // Check vault balance
  let vaultBalance = await connection.getBalance(vaultPda);
  console.log('💰 Vault balance after registration:', vaultBalance / web3.LAMPORTS_PER_SOL, 'SOL\n');

  // ========================================
  // Step 4: Start Tournament
  // ========================================
  console.log('📝 Step 4: Starting Tournament...');

  // Wait for start time to pass
  const waitTime = (startTime - Math.floor(Date.now() / 1000) + 2) * 1000; // Add 2 second buffer
  if (waitTime > 0) {
    console.log(`   Waiting ${Math.ceil(waitTime / 1000)} seconds for tournament start time...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  try {
    const tx = await program.methods
      .startTournament()
      .accounts({
        tournament: tournamentPda,
        admin: walletKeypair.publicKey,
      })
      .rpc();

    console.log('✅ Tournament started!');
    console.log('   Transaction:', tx, '\n');
  } catch (error) {
    console.error('❌ Error starting tournament:', error.message);
    process.exit(1);
  }

  // ========================================
  // Step 5: Submit Results (End Tournament)
  // ========================================
  console.log('📝 Step 5: Submitting Results...');

  // Wait for tournament end_time to pass
  const endWaitTime = (endTime - Math.floor(Date.now() / 1000) + 2) * 1000; // Add 2 second buffer
  if (endWaitTime > 0) {
    console.log(`   Waiting ${Math.ceil(endWaitTime / 1000)} seconds for tournament to end...`);
    await new Promise(resolve => setTimeout(resolve, endWaitTime));
  }

  const winners = [player1.publicKey];

  try {
    const tx = await program.methods
      .submitResults(winners)
      .accounts({
        tournament: tournamentPda,
        admin: walletKeypair.publicKey,
      })
      .rpc();

    console.log('✅ Results submitted!');
    console.log('   Winner:', player1.publicKey.toString());
    console.log('   Transaction:', tx, '\n');
  } catch (error) {
    console.error('❌ Error submitting results:', error.message);
    process.exit(1);
  }

  // ========================================
  // Step 6: Distribute Prizes with Oracle
  // ========================================
  console.log('📝 Step 6: Distributing Prizes with Oracle Verification...\n');

  const publisher = new OracleResultPublisher(
    connection,
    walletKeypair,
    program,
    oracleSigner
  );

  const amounts = [vaultBalance]; // Give all to winner

  try {
    const result = await publisher.publishResult(
      tournamentPda,
      winners,
      amounts,
      walletKeypair.publicKey
    );

    console.log('\n✅ Prizes distributed with oracle verification!');
    console.log('   Transaction:', result.signature);
  } catch (error) {
    console.error('❌ Error distributing prizes:', error.message);
    if (error.logs) {
      console.error('Program logs:', error.logs);
    }
  }

  // ========================================
  // Verify Final State
  // ========================================
  console.log('\n📊 Final Verification:');

  const tournamentAccount = await program.account.tournament.fetch(tournamentPda);
  console.log('   Tournament status:', Object.keys(tournamentAccount.status)[0]);

  const oracleAccount = await program.account.tournamentOracle.fetch(tournamentOraclePda);
  console.log('   Oracle verified at:', new Date(oracleAccount.lastVerificationTimestamp * 1000).toISOString());
  console.log('   Verified winner:', oracleAccount.verifiedWinner.toString());

  const finalVaultBalance = await connection.getBalance(vaultPda);
  const player1FinalBalance = await connection.getBalance(player1.publicKey);

  console.log('   Vault final balance:', finalVaultBalance / web3.LAMPORTS_PER_SOL, 'SOL');
  console.log('   Player 1 final balance:', player1FinalBalance / web3.LAMPORTS_PER_SOL, 'SOL');

  console.log('\n🎉 Oracle Integration Test Complete!');
}

main().catch(console.error);
