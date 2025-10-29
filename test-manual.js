const { PublicKey, Keypair, SystemProgram, Transaction, TransactionInstruction, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Connection } = require("@solana/web3.js");
const BN = require("bn.js");
const borsh = require("borsh");
const fs = require("fs");

// Program ID
const PROGRAM_ID = new PublicKey("BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv");

// Devnet connection
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Load wallet
function loadKeypair(path) {
  const secret = JSON.parse(fs.readFileSync(path, "utf-8"));
  return Keypair.fromSecretKey(Buffer.from(secret));
}

const tournamentOperator = loadKeypair("/home/user/.config/solana/id.json");
const players = Array.from({ length: 5 }, () => Keypair.generate());

console.log("=".repeat(80));
console.log("ESPOTZ TOURNAMENT - MANUAL TRANSACTION BUILDER");
console.log("=".repeat(80));
console.log(`\nTournament Operator: ${tournamentOperator.publicKey.toString()}`);
console.log(`\nPlayers:`);
players.forEach((player, i) => {
  console.log(`  Player ${i + 1}: ${player.publicKey.toString()}`);
});

const transactionHashes = {
  fundingTxs: [],
  tournamentCreation: null,
  playerRegistrations: [],
  tournamentStart: null,
  resultsSubmission: null,
  prizeDistribution: null,
};

// Instruction discriminators from IDL
const DISCRIMINATORS = {
  createTournament: Buffer.from([76, 68, 109, 188, 44, 234, 17, 160]),
  registerPlayer: Buffer.from([95, 183, 15, 108, 86, 35, 223, 89]),
  startTournament: Buffer.from([174, 248, 144, 108, 20, 149, 35, 48]),
  submitResults: Buffer.from([22, 16, 250, 168, 47, 205, 196, 223]),
  distributePrizes: Buffer.from([196, 97, 71, 58, 225, 171, 184, 137]),
};

// Borsh schema for instruction data
class CreateTournamentArgs {
  constructor(fields) {
    this.id = fields.id;
    this.gameType = fields.gameType;
    this.entryFee = fields.entryFee;
    this.maxPlayers = fields.maxPlayers;
    this.startTime = fields.startTime;
    this.endTime = fields.endTime;
  }
}

const CreateTournamentSchema = new Map([
  [CreateTournamentArgs, {
    kind: 'struct',
    fields: [
      ['id', 'u32'],
      ['gameType', { kind: 'enum', field: 'enum', values: [['chess'], ['checkers'], ['go']] }],
      ['entryFee', 'u64'],
      ['maxPlayers', 'u16'],
      ['startTime', 'i64'],
      ['endTime', 'i64'],
    ]
  }]
]);

class SubmitResultsArgs {
  constructor(winners) {
    this.winners = winners;
  }
}

const SubmitResultsSchema = new Map([
  [SubmitResultsArgs, {
    kind: 'struct',
    fields: [
      ['winners', ['u8']], // Simplified - will encode manually
    ]
  }]
]);

async function fundPlayers() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 1: Fund Player Wallets (0.001 SOL each)");
  console.log("=".repeat(80));

  for (let i = 0; i < players.length; i++) {
    const ix = SystemProgram.transfer({
      fromPubkey: tournamentOperator.publicKey,
      toPubkey: players[i].publicKey,
      lamports: 0.001 * LAMPORTS_PER_SOL,
    });

    const tx = new Transaction().add(ix);
    const txSig = await sendAndConfirmTransaction(connection, tx, [tournamentOperator]);

    transactionHashes.fundingTxs.push(txSig);
    console.log(`✓ Funded Player ${i + 1}: ${txSig}`);
    console.log(`  Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
  }
}

async function createTournament() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 2: Create Tournament (0.0003 SOL entry fee)");
  console.log("=".repeat(80));

  const tournamentId = Math.floor(Math.random() * 1000000);
  console.log(`Tournament ID: ${tournamentId}`);

  // Derive PDAs
  const [tournamentPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("tournament"), Buffer.from([tournamentId & 0xFF])],
    PROGRAM_ID
  );

  const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault-authority"), tournamentPda.toBuffer()],
    PROGRAM_ID
  );

  const [vaultAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault-token"), tournamentPda.toBuffer()],
    PROGRAM_ID
  );

  console.log(`Tournament PDA: ${tournamentPda.toString()}`);
  console.log(`Vault Authority PDA: ${vaultAuthorityPda.toString()}`);
  console.log(`Vault Account PDA: ${vaultAccountPda.toString()}`);

  // Build instruction data manually
  const now = Math.floor(Date.now() / 1000);
  const data = Buffer.alloc(1024);
  let offset = 0;

  // Write discriminator
  DISCRIMINATORS.createTournament.copy(data, offset);
  offset += 8;

  // Write id (u32)
  data.writeUInt32LE(tournamentId, offset);
  offset += 4;

  // Write gameType (enum - 0 for Chess)
  data.writeUInt8(0, offset); // 0 = Chess
  offset += 1;

  // Write entryFee (u64)
  const entryFee = new BN(0.0003 * LAMPORTS_PER_SOL);
  entryFee.toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  // Write maxPlayers (u16)
  data.writeUInt16LE(5, offset);
  offset += 2;

  // Write startTime (i64)
  const startTime = new BN(now + 60);
  startTime.toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  // Write endTime (i64)
  const endTime = new BN(now + 86400);
  endTime.toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  const instructionData = data.slice(0, offset);

  console.log(`Instruction data length: ${instructionData.length} bytes`);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: tournamentPda, isSigner: false, isWritable: true },
      { pubkey: vaultAuthorityPda, isSigner: false, isWritable: true },
      { pubkey: vaultAccountPda, isSigner: false, isWritable: true },
      { pubkey: tournamentOperator.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);

  try {
    const txSig = await sendAndConfirmTransaction(connection, tx, [tournamentOperator], {
      commitment: 'confirmed',
      skipPreflight: false,
    });

    transactionHashes.tournamentCreation = txSig;

    console.log(`\n✓ Tournament Created Successfully!`);
    console.log(`✓ Transaction Hash: ${txSig}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

    return { tournamentPda, tournamentId };
  } catch (error) {
    console.error("Create tournament failed:", error);
    if (error.logs) {
      console.error("Program logs:", error.logs);
    }
    throw error;
  }
}

async function registerPlayers(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 3: Register 5 Players (0.0003 SOL each)");
  console.log("=".repeat(80));

  for (let i = 0; i < players.length; i++) {
    // Derive PDAs
    const [playerEntryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player-entry"), tournamentPda.toBuffer(), players[i].publicKey.toBuffer()],
      PROGRAM_ID
    );

    const [vaultAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-token"), tournamentPda.toBuffer()],
      PROGRAM_ID
    );

    console.log(`\nRegistering Player ${i + 1}...`);

    // Build instruction (no args for register_player)
    const instructionData = DISCRIMINATORS.registerPlayer;

    const ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: tournamentPda, isSigner: false, isWritable: true },
        { pubkey: playerEntryPda, isSigner: false, isWritable: true },
        { pubkey: vaultAccountPda, isSigner: false, isWritable: true },
        { pubkey: players[i].publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: instructionData,
    });

    const tx = new Transaction().add(ix);

    try {
      const txSig = await sendAndConfirmTransaction(connection, tx, [players[i]], {
        commitment: 'confirmed',
        skipPreflight: false,
      });

      transactionHashes.playerRegistrations.push(txSig);

      console.log(`✓ Player ${i + 1} Registered!`);
      console.log(`✓ Transaction Hash: ${txSig}`);
      console.log(`✓ Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
    } catch (error) {
      console.error(`Register Player ${i + 1} failed:`, error);
      if (error.logs) {
        console.error("Program logs:", error.logs);
      }
      throw error;
    }
  }
}

async function startTournament(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 4: Start Tournament");
  console.log("=".repeat(80));

  // Build instruction (no args for start_tournament)
  const instructionData = DISCRIMINATORS.startTournament;

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: tournamentPda, isSigner: false, isWritable: true },
      { pubkey: tournamentOperator.publicKey, isSigner: true, isWritable: false },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);

  try {
    const txSig = await sendAndConfirmTransaction(connection, tx, [tournamentOperator], {
      commitment: 'confirmed',
      skipPreflight: false,
    });

    transactionHashes.tournamentStart = txSig;

    console.log(`\n✓ Tournament Started!`);
    console.log(`✓ Transaction Hash: ${txSig}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

    return txSig;
  } catch (error) {
    console.error("Start tournament failed:", error);
    if (error.logs) {
      console.error("Program logs:", error.logs);
    }
    throw error;
  }
}

async function submitResults(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 5: Submit Results (Player 1 Wins)");
  console.log("=".repeat(80));

  // Build instruction data with winner array
  const data = Buffer.alloc(256);
  let offset = 0;

  // Write discriminator
  DISCRIMINATORS.submitResults.copy(data, offset);
  offset += 8;

  // Write winners array (Vec<Pubkey>)
  // Vec length (u32)
  data.writeUInt32LE(1, offset);
  offset += 4;

  // Winner pubkey (32 bytes)
  players[0].publicKey.toBuffer().copy(data, offset);
  offset += 32;

  const instructionData = data.slice(0, offset);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: tournamentPda, isSigner: false, isWritable: true },
      { pubkey: tournamentOperator.publicKey, isSigner: true, isWritable: false },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);

  try {
    const txSig = await sendAndConfirmTransaction(connection, tx, [tournamentOperator], {
      commitment: 'confirmed',
      skipPreflight: false,
    });

    transactionHashes.resultsSubmission = txSig;

    console.log(`\n✓ Results Submitted!`);
    console.log(`✓ Transaction Hash: ${txSig}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

    return txSig;
  } catch (error) {
    console.error("Submit results failed:", error);
    if (error.logs) {
      console.error("Program logs:", error.logs);
    }
    throw error;
  }
}

async function distributePrizes(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 6: Distribute Prizes");
  console.log("=".repeat(80));

  const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault-authority"), tournamentPda.toBuffer()],
    PROGRAM_ID
  );

  const [vaultAccountPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault-token"), tournamentPda.toBuffer()],
    PROGRAM_ID
  );

  // Build instruction data
  const totalPrize = new BN(5 * 0.0003 * LAMPORTS_PER_SOL);
  const data = Buffer.alloc(256);
  let offset = 0;

  // Write discriminator
  DISCRIMINATORS.distributePrizes.copy(data, offset);
  offset += 8;

  // Write winners array (Vec<Pubkey>)
  data.writeUInt32LE(1, offset);
  offset += 4;
  players[0].publicKey.toBuffer().copy(data, offset);
  offset += 32;

  // Write amounts array (Vec<u64>)
  data.writeUInt32LE(1, offset);
  offset += 4;
  totalPrize.toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  const instructionData = data.slice(0, offset);

  console.log(`Prize Amount: ${(totalPrize.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: tournamentPda, isSigner: false, isWritable: true },
      { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
      { pubkey: vaultAccountPda, isSigner: false, isWritable: true },
      { pubkey: tournamentOperator.publicKey, isSigner: true, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      // Winner account in remaining accounts
      { pubkey: players[0].publicKey, isSigner: false, isWritable: true },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);

  try {
    const txSig = await sendAndConfirmTransaction(connection, tx, [tournamentOperator], {
      commitment: 'confirmed',
      skipPreflight: false,
    });

    transactionHashes.prizeDistribution = txSig;

    console.log(`\n✓ Prizes Distributed!`);
    console.log(`✓ Transaction Hash: ${txSig}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

    return txSig;
  } catch (error) {
    console.error("Distribute prizes failed:", error);
    if (error.logs) {
      console.error("Program logs:", error.logs);
    }
    throw error;
  }
}

async function main() {
  try {
    const operatorBalance = await connection.getBalance(tournamentOperator.publicKey);
    console.log(`\nTournament Operator Balance: ${(operatorBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

    // Step 1: Fund players
    await fundPlayers();

    // Step 2: Create tournament
    const { tournamentPda } = await createTournament();

    // Step 3: Register players
    await registerPlayers(tournamentPda);

    // Wait for tournament start time
    console.log("\n⏳ Waiting 70 seconds for tournament start time...");
    await new Promise(resolve => setTimeout(resolve, 70000));

    // Step 4: Start tournament
    await startTournament(tournamentPda);

    // Step 5: Submit results
    await submitResults(tournamentPda);

    // Step 6: Distribute prizes
    await distributePrizes(tournamentPda);

    // Print summary
    console.log("\n" + "=".repeat(80));
    console.log("COMPLETE TRANSACTION SUMMARY");
    console.log("=".repeat(80));

    console.log(`\n1. TOURNAMENT CREATION:`);
    console.log(`   Hash: ${transactionHashes.tournamentCreation}`);
    console.log(`   Link: https://explorer.solana.com/tx/${transactionHashes.tournamentCreation}?cluster=devnet`);

    console.log(`\n2. PLAYER REGISTRATIONS (5 transactions):`);
    transactionHashes.playerRegistrations.forEach((tx, i) => {
      console.log(`   Player ${i + 1}:`);
      console.log(`     Hash: ${tx}`);
      console.log(`     Link: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    });

    console.log(`\n3. TOURNAMENT START:`);
    console.log(`   Hash: ${transactionHashes.tournamentStart}`);
    console.log(`   Link: https://explorer.solana.com/tx/${transactionHashes.tournamentStart}?cluster=devnet`);

    console.log(`\n4. RESULTS SUBMISSION:`);
    console.log(`   Hash: ${transactionHashes.resultsSubmission}`);
    console.log(`   Link: https://explorer.solana.com/tx/${transactionHashes.resultsSubmission}?cluster=devnet`);

    console.log(`\n5. PRIZE DISTRIBUTION:`);
    console.log(`   Hash: ${transactionHashes.prizeDistribution}`);
    console.log(`   Link: https://explorer.solana.com/tx/${transactionHashes.prizeDistribution}?cluster=devnet`);

    console.log("\n" + "=".repeat(80));
    console.log("✓ ALL USER FLOWS TESTED SUCCESSFULLY!");
    console.log("=".repeat(80));

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  }
}

main();
