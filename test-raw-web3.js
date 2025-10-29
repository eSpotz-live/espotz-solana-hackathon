const { PublicKey, Keypair, SystemProgram, Transaction, TransactionInstruction, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Connection } = require("@solana/web3.js");
const BN = require("bn.js");
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
console.log("ESPOTZ TOURNAMENT - RAW WEB3.JS CLIENT (NO ANCHOR)");
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

// Correct discriminators from IDL
const DISCRIMINATORS = {
  createTournament: Buffer.from([158, 137, 233, 231, 73, 132, 191, 68]),
  registerPlayer: Buffer.from([242, 146, 194, 234, 234, 145, 228, 42]),
  startTournament: Buffer.from([164, 168, 208, 157, 43, 10, 220, 241]),
  submitResults: Buffer.from([22, 16, 250, 159, 91, 235, 19, 57]),
  distributePrizes: Buffer.from([154, 99, 201, 93, 82, 104, 73, 232]),
};

async function fundPlayers() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 1: Fund Player Wallets (0.003 SOL each)");
  console.log("=".repeat(80));

  for (let i = 0; i < players.length; i++) {
    const ix = SystemProgram.transfer({
      fromPubkey: tournamentOperator.publicKey,
      toPubkey: players[i].publicKey,
      lamports: 0.003 * LAMPORTS_PER_SOL,
    });

    const tx = new Transaction().add(ix);
    const txSig = await sendAndConfirmTransaction(connection, tx, [tournamentOperator]);

    transactionHashes.fundingTxs.push(txSig);
    console.log(`✓ Funded Player ${i + 1}`);
    console.log(`  Hash: ${txSig}`);
    console.log(`  Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
  }
}

async function createTournament() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 2: Create Tournament (0.0003 SOL entry fee, 5 max players)");
  console.log("=".repeat(80));

  const tournamentId = Math.floor(Math.random() * 1000000);
  console.log(`Tournament ID: ${tournamentId}`);

  // Derive PDAs
  const tournamentIdBuf = Buffer.alloc(4);
  tournamentIdBuf.writeUInt32LE(tournamentId);

  const [tournamentPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("tournament"), tournamentIdBuf], // Using all 4 bytes as required by Rust program
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
  console.log(`Vault Authority: ${vaultAuthorityPda.toString()}`);
  console.log(`Vault Account: ${vaultAccountPda.toString()}`);

  // Build instruction data manually
  const now = Math.floor(Date.now() / 1000);
  const data = Buffer.alloc(256);
  let offset = 0;

  // Discriminator (8 bytes)
  DISCRIMINATORS.createTournament.copy(data, offset);
  offset += 8;

  // id (u32 little endian)
  data.writeUInt32LE(tournamentId, offset);
  offset += 4;

  // gameType (enum u8: 0=Chess, 1=Checkers, 2=Go)
  data.writeUInt8(0, offset); // Chess
  offset += 1;

  // entryFee (u64 little endian)
  const entryFee = new BN(0.0003 * LAMPORTS_PER_SOL);
  entryFee.toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  // maxPlayers (u16 little endian)
  data.writeUInt16LE(5, offset);
  offset += 2;

  // startTime (i64 little endian)
  const startTime = new BN(now + 60);
  startTime.toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  // endTime (i64 little endian) - 2 minutes after start for testing
  const endTime = new BN(now + 180);
  endTime.toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  const instructionData = data.slice(0, offset);

  console.log(`Instruction data: ${instructionData.length} bytes`);

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

    console.log(`\n✓ Tournament Created!`);
    console.log(`✓ Hash: ${txSig}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

    return { tournamentPda, tournamentId };
  } catch (error) {
    console.error("❌ Create tournament failed:", error.message);
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
    const [playerEntryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player-entry"), tournamentPda.toBuffer(), players[i].publicKey.toBuffer()],
      PROGRAM_ID
    );

    const [vaultAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-token"), tournamentPda.toBuffer()],
      PROGRAM_ID
    );

    console.log(`\nRegistering Player ${i + 1}...`);

    // No args for register_player
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
      });

      transactionHashes.playerRegistrations.push(txSig);

      console.log(`✓ Player ${i + 1} Registered!`);
      console.log(`  Hash: ${txSig}`);
      console.log(`  Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);
    } catch (error) {
      console.error(`❌ Player ${i + 1} registration failed:`, error.message);
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
    });

    transactionHashes.tournamentStart = txSig;

    console.log(`\n✓ Tournament Started!`);
    console.log(`✓ Hash: ${txSig}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

    return txSig;
  } catch (error) {
    console.error("❌ Start tournament failed:", error.message);
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

  // Build winners array with borsh
  const data = Buffer.alloc(256);
  let offset = 0;

  // Discriminator
  DISCRIMINATORS.submitResults.copy(data, offset);
  offset += 8;

  // Vec<Pubkey> - length (u32 little endian)
  data.writeUInt32LE(1, offset);
  offset += 4;

  // Winner pubkey
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
    });

    transactionHashes.resultsSubmission = txSig;

    console.log(`\n✓ Results Submitted!`);
    console.log(`✓ Hash: ${txSig}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

    return txSig;
  } catch (error) {
    console.error("❌ Submit results failed:", error.message);
    if (error.logs) {
      console.error("Program logs:", error.logs);
    }
    throw error;
  }
}

async function distributePrizes(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 6: Distribute Prizes (0.0015 SOL to Player 1)");
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

  // Discriminator
  DISCRIMINATORS.distributePrizes.copy(data, offset);
  offset += 8;

  // Vec<Pubkey> winners - length
  data.writeUInt32LE(1, offset);
  offset += 4;
  // Winner pubkey
  players[0].publicKey.toBuffer().copy(data, offset);
  offset += 32;

  // Vec<u64> amounts - length
  data.writeUInt32LE(1, offset);
  offset += 4;
  // Amount (u64 little endian)
  totalPrize.toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  const instructionData = data.slice(0, offset);

  console.log(`Prize: ${(totalPrize.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: tournamentPda, isSigner: false, isWritable: true },
      { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
      { pubkey: vaultAccountPda, isSigner: false, isWritable: true },
      { pubkey: tournamentOperator.publicKey, isSigner: true, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      // Winner in remaining accounts
      { pubkey: players[0].publicKey, isSigner: false, isWritable: true },
    ],
    data: instructionData,
  });

  const tx = new Transaction().add(ix);

  try {
    const txSig = await sendAndConfirmTransaction(connection, tx, [tournamentOperator], {
      commitment: 'confirmed',
    });

    transactionHashes.prizeDistribution = txSig;

    console.log(`\n✓ Prizes Distributed!`);
    console.log(`✓ Hash: ${txSig}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

    return txSig;
  } catch (error) {
    console.error("❌ Distribute prizes failed:", error.message);
    if (error.logs) {
      console.error("Program logs:", error.logs);
    }
    throw error;
  }
}

async function main() {
  try {
    const operatorBalance = await connection.getBalance(tournamentOperator.publicKey);
    console.log(`\nOperator Balance: ${(operatorBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

    // Step 1: Fund players
    await fundPlayers();

    // Step 2: Create tournament
    const { tournamentPda } = await createTournament();

    // Step 3: Register players
    await registerPlayers(tournamentPda);

    // Wait for start time
    console.log("\n⏳ Waiting 70 seconds for tournament start time...");
    await new Promise(resolve => setTimeout(resolve, 70000));

    // Step 4: Start tournament
    await startTournament(tournamentPda);

    // Wait for tournament to end (3 minutes total from creation)
    console.log("\n⏳ Waiting 130 seconds for tournament to end...");
    await new Promise(resolve => setTimeout(resolve, 130000));

    // Step 5: Submit results
    await submitResults(tournamentPda);

    // Step 6: Distribute prizes
    await distributePrizes(tournamentPda);

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("✅ COMPLETE TRANSACTION SUMMARY");
    console.log("=".repeat(80));

    console.log(`\n1. TOURNAMENT CREATION:`);
    console.log(`   ${transactionHashes.tournamentCreation}`);
    console.log(`   https://explorer.solana.com/tx/${transactionHashes.tournamentCreation}?cluster=devnet`);

    console.log(`\n2. PLAYER REGISTRATIONS (5 txs):`);
    transactionHashes.playerRegistrations.forEach((tx, i) => {
      console.log(`   Player ${i + 1}: ${tx}`);
      console.log(`   https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    });

    console.log(`\n3. TOURNAMENT START:`);
    console.log(`   ${transactionHashes.tournamentStart}`);
    console.log(`   https://explorer.solana.com/tx/${transactionHashes.tournamentStart}?cluster=devnet`);

    console.log(`\n4. RESULTS SUBMISSION:`);
    console.log(`   ${transactionHashes.resultsSubmission}`);
    console.log(`   https://explorer.solana.com/tx/${transactionHashes.resultsSubmission}?cluster=devnet`);

    console.log(`\n5. PRIZE DISTRIBUTION:`);
    console.log(`   ${transactionHashes.prizeDistribution}`);
    console.log(`   https://explorer.solana.com/tx/${transactionHashes.prizeDistribution}?cluster=devnet`);

    console.log("\n" + "=".repeat(80));
    console.log("✅ ALL USER FLOWS TESTED SUCCESSFULLY!");
    console.log("=".repeat(80));
    console.log(`Total Transactions: 9 (5 funding + 1 create + 5 register + start + results + prizes)`);

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  }
}

main();
