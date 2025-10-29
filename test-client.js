const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const fs = require("fs");

// Program ID
const PROGRAM_ID = new PublicKey("BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv");

// Devnet connection
const connection = new anchor.web3.Connection(
  "https://api.devnet.solana.com",
  "confirmed"
);

// Load wallets from files
function loadKeypair(path) {
  const secret = JSON.parse(fs.readFileSync(path, "utf-8"));
  return Keypair.fromSecretKey(Buffer.from(secret));
}

// User A (Tournament Operator)
const userA = loadKeypair("/home/user/.config/solana/id.json");

// Create User B (Player) keypair
const userB = Keypair.generate();

console.log("=".repeat(80));
console.log("ESPOTZ TOURNAMENT SMART CONTRACT TEST");
console.log("=".repeat(80));
console.log(`\nUser A (Operator): ${userA.publicKey.toString()}`);
console.log(`User B (Player): ${userB.publicKey.toString()}`);

// ============================================================================
// STEP 1: Transfer SOL to User B (so they can participate)
// ============================================================================
async function transferSOLToUserB() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 1: Transfer SOL to User B");
  console.log("=".repeat(80));

  try {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(userA),
      { commitment: "confirmed" }
    );

    const ix = SystemProgram.transfer({
      fromPubkey: userA.publicKey,
      toPubkey: userB.publicKey,
      lamports: 1 * LAMPORTS_PER_SOL,
    });

    const transaction = new anchor.web3.Transaction().add(ix);
    const txSig = await anchor.web3.sendAndConfirmTransaction(connection, transaction, [userA]);

    const balance = await connection.getBalance(userB.publicKey);
    console.log(`✓ Transferred 2 SOL to User B from User A`);
    console.log(`✓ User B Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`✓ Transfer Signature: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

    return txSig;
  } catch (error) {
    console.error("Transfer failed:", error);
    throw error;
  }
}

// ============================================================================
// STEP 2: User A Creates Tournament
// ============================================================================
async function createTournament() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 2: User A Creates Tournament");
  console.log("=".repeat(80));

  try {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(userA),
      { commitment: "confirmed" }
    );

    const idlPath = "/home/user/Desktop/claude/espotz-solana/target/idl/tournament.json";
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

    const program = new anchor.Program(idl, PROGRAM_ID, provider);

    const tournamentId = 1;
    const gameType = { chess: {} };
    const entryFee = new anchor.BN(0.5 * LAMPORTS_PER_SOL); // 0.5 SOL entry fee
    const maxPlayers = 4;

    const now = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(now + 60); // 60 seconds from now
    const endTime = new anchor.BN(now + 86400); // 24 hours from now

    // Derive PDAs
    const [tournamentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tournament"), Buffer.from([tournamentId])],
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

    console.log(`Tournament ID: ${tournamentId}`);
    console.log(`Game Type: Chess`);
    console.log(`Entry Fee: 0.5 SOL`);
    console.log(`Max Players: ${maxPlayers}`);
    console.log(`Start Time: ${new Date(startTime.toNumber() * 1000).toISOString()}`);
    console.log(`End Time: ${new Date(endTime.toNumber() * 1000).toISOString()}`);
    console.log(`Tournament PDA: ${tournamentPda.toString()}`);

    const tx = await program.methods
      .createTournament(
        tournamentId,
        gameType,
        entryFee,
        maxPlayers,
        startTime,
        endTime
      )
      .accounts({
        tournament: tournamentPda,
        vaultAuthority: vaultAuthorityPda,
        vaultAccount: vaultAccountPda,
        admin: userA.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`\n✓ Tournament Created Successfully!`);
    console.log(`✓ Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    return { tournamentPda, txHash: tx };
  } catch (error) {
    console.error("Create tournament failed:", error);
    throw error;
  }
}

// ============================================================================
// STEP 3: User B Registers for Tournament
// ============================================================================
async function registerPlayer(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 3: User B Registers for Tournament");
  console.log("=".repeat(80));

  try {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(userB),
      { commitment: "confirmed" }
    );

    const idlPath = "/home/user/Desktop/claude/espotz-solana/target/idl/tournament.json";
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

    const program = new anchor.Program(idl, PROGRAM_ID, provider);

    // Derive PDAs
    const [playerEntryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player-entry"), tournamentPda.toBuffer(), userB.publicKey.toBuffer()],
      PROGRAM_ID
    );

    const [vaultAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-token"), tournamentPda.toBuffer()],
      PROGRAM_ID
    );

    console.log(`Player: ${userB.publicKey.toString()}`);
    console.log(`Tournament: ${tournamentPda.toString()}`);
    console.log(`Player Entry PDA: ${playerEntryPda.toString()}`);

    const tx = await program.methods
      .registerPlayer()
      .accounts({
        tournament: tournamentPda,
        playerEntry: playerEntryPda,
        vaultAccount: vaultAccountPda,
        player: userB.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([userB])
      .rpc();

    const userBBalance = await connection.getBalance(userB.publicKey);
    console.log(`\n✓ Player Registered Successfully!`);
    console.log(`✓ Entry Fee Paid: 0.5 SOL`);
    console.log(`✓ User B Remaining Balance: ${(userBBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`✓ Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    return tx;
  } catch (error) {
    console.error("Register player failed:", error);
    throw error;
  }
}

// ============================================================================
// STEP 4: User A Starts Tournament
// ============================================================================
async function startTournament(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 4: User A Starts Tournament");
  console.log("=".repeat(80));

  try {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(userA),
      { commitment: "confirmed" }
    );

    const idlPath = "/home/user/Desktop/claude/espotz-solana/target/idl/tournament.json";
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

    const program = new anchor.Program(idl, PROGRAM_ID, provider);

    console.log(`Changing tournament status from Registration → Active`);
    console.log(`Tournament: ${tournamentPda.toString()}`);

    const tx = await program.methods
      .startTournament()
      .accounts({
        tournament: tournamentPda,
        admin: userA.publicKey,
      })
      .rpc();

    console.log(`\n✓ Tournament Started Successfully!`);
    console.log(`✓ Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    return tx;
  } catch (error) {
    console.error("Start tournament failed:", error);
    throw error;
  }
}

// ============================================================================
// STEP 5: User A Submits Results (User B as Winner)
// ============================================================================
async function submitResults(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 5: User A Submits Results (User B Wins)");
  console.log("=".repeat(80));

  try {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(userA),
      { commitment: "confirmed" }
    );

    const idlPath = "/home/user/Desktop/claude/espotz-solana/target/idl/tournament.json";
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

    const program = new anchor.Program(idl, PROGRAM_ID, provider);

    const winners = [userB.publicKey];

    console.log(`Winners: ${winners.map(w => w.toString()).join(", ")}`);
    console.log(`Tournament: ${tournamentPda.toString()}`);

    const tx = await program.methods
      .submitResults(winners)
      .accounts({
        tournament: tournamentPda,
        admin: userA.publicKey,
      })
      .rpc();

    console.log(`\n✓ Results Submitted Successfully!`);
    console.log(`✓ Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    return tx;
  } catch (error) {
    console.error("Submit results failed:", error);
    throw error;
  }
}

// ============================================================================
// STEP 6: User A Distributes Prizes
// ============================================================================
async function distributePrizes(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 6: User A Distributes Prizes to Winner");
  console.log("=".repeat(80));

  try {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(userA),
      { commitment: "confirmed" }
    );

    const idlPath = "/home/user/Desktop/claude/espotz-solana/target/idl/tournament.json";
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

    const program = new anchor.Program(idl, PROGRAM_ID, provider);

    const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-authority"), tournamentPda.toBuffer()],
      PROGRAM_ID
    );

    const [vaultAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-token"), tournamentPda.toBuffer()],
      PROGRAM_ID
    );

    const winners = [userB.publicKey];
    const amounts = [new anchor.BN(0.5 * LAMPORTS_PER_SOL)]; // Prize = entry fee

    console.log(`Winners: ${winners.map(w => w.toString()).join(", ")}`);
    console.log(`Prize Amounts: ${amounts.map(a => (a.toNumber() / LAMPORTS_PER_SOL).toFixed(4) + " SOL").join(", ")}`);
    console.log(`Vault Account: ${vaultAccountPda.toString()}`);

    const tx = await program.methods
      .distributePrizes(winners, amounts)
      .accounts({
        tournament: tournamentPda,
        vaultAuthority: vaultAuthorityPda,
        vaultAccount: vaultAccountPda,
        admin: userA.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts([
        { pubkey: userB.publicKey, isSigner: false, isWritable: true },
      ])
      .rpc();

    const userBBalance = await connection.getBalance(userB.publicKey);
    console.log(`\n✓ Prizes Distributed Successfully!`);
    console.log(`✓ User B Final Balance: ${(userBBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`✓ Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    return tx;
  } catch (error) {
    console.error("Distribute prizes failed:", error);
    throw error;
  }
}

// ============================================================================
// MAIN TEST FLOW
// ============================================================================
async function main() {
  try {
    // Step 1: Transfer SOL to User B
    const transferTx = await transferSOLToUserB();

    // Step 2: User A creates tournament
    const { tournamentPda, txHash: createTxHash } = await createTournament();

    // Step 3: User B registers
    const registerTxHash = await registerPlayer(tournamentPda);

    // Wait for tournament to actually start
    console.log("\n⏳ Waiting 90 seconds for tournament start time to arrive...");
    await new Promise(resolve => setTimeout(resolve, 90000));

    // Step 4: User A starts tournament
    const startTxHash = await startTournament(tournamentPda);

    // Step 5: User A submits results
    const resultsTxHash = await submitResults(tournamentPda);

    // Step 6: User A distributes prizes
    const prizesTxHash = await distributePrizes(tournamentPda);

    // ========================================================================
    // SUMMARY REPORT
    // ========================================================================
    console.log("\n" + "=".repeat(80));
    console.log("TEST SUMMARY - ALL TRANSACTION HASHES");
    console.log("=".repeat(80));
    console.log(`\n1. Tournament Created (User A):`);
    console.log(`   Hash: ${createTxHash}`);
    console.log(`   Link: https://explorer.solana.com/tx/${createTxHash}?cluster=devnet`);

    console.log(`\n2. Player Registered (User B):`);
    console.log(`   Hash: ${registerTxHash}`);
    console.log(`   Link: https://explorer.solana.com/tx/${registerTxHash}?cluster=devnet`);

    console.log(`\n3. Tournament Started (User A):`);
    console.log(`   Hash: ${startTxHash}`);
    console.log(`   Link: https://explorer.solana.com/tx/${startTxHash}?cluster=devnet`);

    console.log(`\n4. Results Submitted (User A):`);
    console.log(`   Hash: ${resultsTxHash}`);
    console.log(`   Link: https://explorer.solana.com/tx/${resultsTxHash}?cluster=devnet`);

    console.log(`\n5. Prizes Distributed (User A):`);
    console.log(`   Hash: ${prizesTxHash}`);
    console.log(`   Link: https://explorer.solana.com/tx/${prizesTxHash}?cluster=devnet`);

    console.log(`\n` + "=".repeat(80));
    console.log("USER DETAILS");
    console.log("=".repeat(80));
    console.log(`\nUser A (Tournament Operator):`);
    console.log(`  Address: ${userA.publicKey.toString()}`);
    console.log(`  Explorer: https://explorer.solana.com/address/${userA.publicKey}?cluster=devnet`);

    console.log(`\nUser B (Player/Winner):`);
    console.log(`  Address: ${userB.publicKey.toString()}`);
    const finalBalance = await connection.getBalance(userB.publicKey);
    console.log(`  Final Balance: ${(finalBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`  Explorer: https://explorer.solana.com/address/${userB.publicKey}?cluster=devnet`);

    console.log("\n" + "=".repeat(80));
    console.log("✓ FULL TEST FLOW COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(80));

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  }
}

main();
