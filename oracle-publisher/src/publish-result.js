import * as web3 from '@solana/web3.js';
import anchor from '@coral-xyz/anchor';
const { BN, AnchorProvider, Program, Wallet } = anchor;
import { OracleSigner } from './oracle-signer.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

/**
 * Oracle Result Publisher
 * Publishes tournament results to the blockchain with Ed25519 signature verification
 */
class OracleResultPublisher {
  constructor(connection, wallet, program, oracleSigner) {
    this.connection = connection;
    this.wallet = wallet;
    this.program = program;
    this.oracleSigner = oracleSigner;
  }

  /**
   * Initialize oracle for a tournament
   */
  async initializeOracle(tournamentPubkey, oracleQueuePubkey) {
    console.log('Initializing oracle for tournament:', tournamentPubkey.toString());

    const [tournamentOraclePda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('tournament-oracle'), tournamentPubkey.toBuffer()],
      this.program.programId
    );

    try {
      const tx = await this.program.methods
        .initializeOracle()
        .accounts({
          tournament: tournamentPubkey,
          tournamentOracle: tournamentOraclePda,
          oracleFeed: this.oracleSigner.publicKey, // Oracle authority pubkey
          oracleQueue: oracleQueuePubkey,
          admin: this.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('✅ Oracle initialized. Transaction:', tx);
      return { tournamentOracle: tournamentOraclePda, signature: tx };
    } catch (error) {
      console.error('Error initializing oracle:', error);
      throw error;
    }
  }

  /**
   * Publish tournament result with oracle signature
   */
  async publishResult(tournamentPubkey, winners, amounts, authority) {
    console.log('\n📡 Publishing Tournament Result...');
    console.log('Tournament:', tournamentPubkey.toString());
    console.log('Winners:', winners.map(w => w.toString()));
    console.log('Amounts:', amounts);

    // Create result data
    const resultData = {
      tournament: tournamentPubkey,
      timestamp: Math.floor(Date.now() / 1000),
      winners: winners,
      amounts: amounts,
    };

    // Sign the result with oracle's Ed25519 key
    const { signature, message, publicKey } = this.oracleSigner.signTournamentResult(resultData);

    console.log('\n🔐 Oracle Signature Generated');
    console.log('Message hash:', message.toString('hex').slice(0, 64) + '...');
    console.log('Signature:', Buffer.from(signature).toString('hex').slice(0, 64) + '...');

    // Create Ed25519 verification instruction
    const ed25519Ix = this.oracleSigner.createEd25519Instruction(
      signature,
      message,
      publicKey
    );

    // Get PDAs
    const [tournamentOraclePda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('tournament-oracle'), tournamentPubkey.toBuffer()],
      this.program.programId
    );

    const [vaultAuthorityPda, vaultAuthorityBump] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('vault-authority'), tournamentPubkey.toBuffer()],
      this.program.programId
    );

    const [vaultAccountPda] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from('vault-token'), tournamentPubkey.toBuffer()],
      this.program.programId
    );

    try {
      // Build the distribute_prizes_oracle instruction
      const distributePrizesIx = await this.program.methods
        .distributePrizesOracle(winners, amounts.map(a => new BN(a)))
        .accounts({
          tournament: tournamentPubkey,
          tournamentOracle: tournamentOraclePda,
          oracleAuthority: this.oracleSigner.publicKey,
          instructionSysvar: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          vaultAuthority: vaultAuthorityPda,
          vaultAccount: vaultAccountPda,
          authority: authority,
          systemProgram: web3.SystemProgram.programId,
        })
        .remainingAccounts(
          winners.map(winner => ({
            pubkey: winner,
            isSigner: false,
            isWritable: true,
          }))
        )
        .instruction();

      // Create transaction with BOTH instructions
      // Ed25519 verification must come FIRST
      const transaction = new web3.Transaction();
      transaction.add(ed25519Ix);
      transaction.add(distributePrizesIx);

      // Send transaction
      const tx = await web3.sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.wallet],
        { commitment: 'confirmed' }
      );

      console.log('\n✅ Tournament result published successfully!');
      console.log('Transaction:', tx);

      return { signature: tx, tournamentOracle: tournamentOraclePda };
    } catch (error) {
      console.error('\n❌ Error publishing result:', error);
      if (error.logs) {
        console.error('Program logs:', error.logs);
      }
      throw error;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  // Load configuration
  const cluster = process.env.SOLANA_CLUSTER || 'devnet';
  const connection = new web3.Connection(
    web3.clusterApiUrl(cluster),
    'confirmed'
  );

  // Load wallet
  const walletPath = process.env.WALLET_PATH || path.join(process.env.HOME, '.config/solana/id.json');
  const walletKeypair = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );

  console.log('🔑 Wallet:', walletKeypair.publicKey.toString());

  // Load oracle signer
  if (!process.env.ORACLE_SECRET_KEY) {
    console.error('❌ ORACLE_SECRET_KEY not found in .env file');
    console.log('Generate one by running: node src/oracle-signer.js');
    process.exit(1);
  }

  const oracleSigner = new OracleSigner(process.env.ORACLE_SECRET_KEY);
  console.log('🔮 Oracle Public Key:', oracleSigner.publicKey.toString());

  // Load program IDL
  const idlPath = path.join(__dirname, '../../target/idl/tournament.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  const programId = new web3.PublicKey(idl.address);

  const provider = new AnchorProvider(
    connection,
    new Wallet(walletKeypair),
    { commitment: 'confirmed' }
  );

  const program = new Program(idl, provider);

  console.log('📋 Program ID:', programId.toString());

  // Create publisher
  const publisher = new OracleResultPublisher(
    connection,
    walletKeypair,
    program,
    oracleSigner
  );

  // Example usage - replace with actual tournament data
  const tournamentPubkey = new web3.PublicKey(process.env.TOURNAMENT_PUBKEY || 'YOUR_TOURNAMENT_PUBKEY');
  const winner1 = new web3.PublicKey(process.env.WINNER1_PUBKEY || walletKeypair.publicKey.toString());

  const winners = [winner1];
  const amounts = [1000000]; // 0.001 SOL in lamports

  // Initialize oracle (only needed once per tournament)
  if (process.env.INITIALIZE_ORACLE === 'true') {
    await publisher.initializeOracle(
      tournamentPubkey,
      web3.PublicKey.default // Placeholder for oracle queue
    );
  }

  // Publish result
  await publisher.publishResult(
    tournamentPubkey,
    winners,
    amounts,
    walletKeypair.publicKey
  );
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { OracleResultPublisher };
