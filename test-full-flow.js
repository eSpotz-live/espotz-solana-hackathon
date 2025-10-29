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

// Load Tournament Operator wallet
function loadKeypair(path) {
  const secret = JSON.parse(fs.readFileSync(path, "utf-8"));
  return Keypair.fromSecretKey(Buffer.from(secret));
}

const tournamentOperator = loadKeypair("/home/user/.config/solana/id.json");

// Create 5 player wallets
const players = Array.from({ length: 5 }, () => Keypair.generate());

console.log("=".repeat(80));
console.log("ESPOTZ TOURNAMENT SMART CONTRACT - FULL USER FLOW TEST");
console.log("=".repeat(80));
console.log(`\nTournament Operator: ${tournamentOperator.publicKey.toString()}`);
console.log(`\nPlayers:`);
players.forEach((player, i) => {
  console.log(`  Player ${i + 1}: ${player.publicKey.toString()}`);
});

const transactionHashes = {
  tournamentCreation: null,
  playerRegistrations: [],
  tournamentStart: null,
  resultsSubmission: null,
  prizeDistribution: null,
};

// ============================================================================
// STEP 1: Fund Player Wallets
// ============================================================================
async function fundPlayers() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 1: Fund Player Wallets (0.001 SOL each)");
  console.log("=".repeat(80));

  const fundingTxs = [];

  for (let i = 0; i < players.length; i++) {
    const ix = SystemProgram.transfer({
      fromPubkey: tournamentOperator.publicKey,
      toPubkey: players[i].publicKey,
      lamports: 0.001 * LAMPORTS_PER_SOL,
    });

    const tx = new anchor.web3.Transaction().add(ix);
    const txSig = await anchor.web3.sendAndConfirmTransaction(
      connection,
      tx,
      [tournamentOperator]
    );

    fundingTxs.push(txSig);
    console.log(`✓ Funded Player ${i + 1}: ${txSig}`);
  }

  return fundingTxs;
}

// ============================================================================
// STEP 2: Create Tournament
// ============================================================================
async function createTournament() {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 2: Tournament Operator Creates Tournament");
  console.log("=".repeat(80));

  try {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(tournamentOperator),
      { commitment: "confirmed" }
    );

    const idlPath = "/home/user/Desktop/claude/espotz-solana/target/idl/tournament.json";
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    const program = new anchor.Program(idl, PROGRAM_ID, provider);

    const tournamentId = Math.floor(Math.random() * 1000000);
    const gameType = { chess: {} };
    const entryFee = new anchor.BN(0.0003 * LAMPORTS_PER_SOL); // 0.0003 SOL
    const maxPlayers = 5;

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
    console.log(`Entry Fee: 0.0003 SOL`);
    console.log(`Max Players: ${maxPlayers}`);
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
        admin: tournamentOperator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    transactionHashes.tournamentCreation = tx;

    console.log(`\n✓ Tournament Created Successfully!`);
    console.log(`✓ Transaction Hash: ${tx}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    return { tournamentPda, tournamentId };
  } catch (error) {
    console.error("Create tournament failed:", error);
    throw error;
  }
}

// ============================================================================
// STEP 3: Register Players
// ============================================================================
async function registerPlayers(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 3: Register 5 Players (0.0003 SOL each)");
  console.log("=".repeat(80));

  const idlPath = "/home/user/Desktop/claude/espotz-solana/target/idl/tournament.json";
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));

  for (let i = 0; i < players.length; i++) {
    try {
      const provider = new anchor.AnchorProvider(
        connection,
        new anchor.Wallet(players[i]),
        { commitment: "confirmed" }
      );

      const program = new anchor.Program(idl, PROGRAM_ID, provider);

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
      console.log(`  Player: ${players[i].publicKey.toString()}`);

      const tx = await program.methods
        .registerPlayer()
        .accounts({
          tournament: tournamentPda,
          playerEntry: playerEntryPda,
          vaultAccount: vaultAccountPda,
          player: players[i].publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([players[i]])
        .rpc();

      transactionHashes.playerRegistrations.push(tx);

      console.log(`✓ Player ${i + 1} Registered Successfully!`);
      console.log(`✓ Transaction Hash: ${tx}`);
      console.log(`✓ Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    } catch (error) {
      console.error(`Register Player ${i + 1} failed:`, error);
      throw error;
    }
  }
}

// ============================================================================
// STEP 4: Start Tournament
// ============================================================================
async function startTournament(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 4: Tournament Operator Starts Tournament");
  console.log("=".repeat(80));

  try {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(tournamentOperator),
      { commitment: "confirmed" }
    );

    const idlPath = "/home/user/Desktop/claude/espotz-solana/target/idl/tournament.json";
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    const program = new anchor.Program(idl, PROGRAM_ID, provider);

    console.log(`Changing tournament status from Registration → Active`);

    const tx = await program.methods
      .startTournament()
      .accounts({
        tournament: tournamentPda,
        admin: tournamentOperator.publicKey,
      })
      .rpc();

    transactionHashes.tournamentStart = tx;

    console.log(`\n✓ Tournament Started Successfully!`);
    console.log(`✓ Transaction Hash: ${tx}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    return tx;
  } catch (error) {
    console.error("Start tournament failed:", error);
    throw error;
  }
}

// ============================================================================
// STEP 5: Submit Results
// ============================================================================
async function submitResults(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 5: Tournament Operator Submits Results");
  console.log("=".repeat(80));

  try {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(tournamentOperator),
      { commitment: "confirmed" }
    );

    const idlPath = "/home/user/Desktop/claude/espotz-solana/target/idl/tournament.json";
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    const program = new anchor.Program(idl, PROGRAM_ID, provider);

    // Winner: Player 1 (first player)
    const winners = [players[0].publicKey];

    console.log(`Winners: Player 1 (${players[0].publicKey.toString()})`);

    const tx = await program.methods
      .submitResults(winners)
      .accounts({
        tournament: tournamentPda,
        admin: tournamentOperator.publicKey,
      })
      .rpc();

    transactionHashes.resultsSubmission = tx;

    console.log(`\n✓ Results Submitted Successfully!`);
    console.log(`✓ Transaction Hash: ${tx}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    return tx;
  } catch (error) {
    console.error("Submit results failed:", error);
    throw error;
  }
}

// ============================================================================
// STEP 6: Distribute Prizes
// ============================================================================
async function distributePrizes(tournamentPda) {
  console.log("\n" + "=".repeat(80));
  console.log("STEP 6: Tournament Operator Distributes Prizes");
  console.log("=".repeat(80));

  try {
    const provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(tournamentOperator),
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

    const winners = [players[0].publicKey];
    const totalPrizePool = 5 * 0.0003 * LAMPORTS_PER_SOL; // 5 players × 0.0003 SOL
    const amounts = [new anchor.BN(totalPrizePool)]; // Winner takes all

    console.log(`Winner: Player 1`);
    console.log(`Prize Amount: ${(totalPrizePool / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

    const tx = await program.methods
      .distributePrizes(winners, amounts)
      .accounts({
        tournament: tournamentPda,
        vaultAuthority: vaultAuthorityPda,
        vaultAccount: vaultAccountPda,
        admin: tournamentOperator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts([
        { pubkey: players[0].publicKey, isSigner: false, isWritable: true },
      ])
      .rpc();

    transactionHashes.prizeDistribution = tx;

    console.log(`\n✓ Prizes Distributed Successfully!`);
    console.log(`✓ Transaction Hash: ${tx}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);

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
    // Check operator balance
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

    // ========================================================================
    // FINAL SUMMARY REPORT
    // ========================================================================
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
    console.log(`\nTotal Transactions: 9`);
    console.log(`  - 1 Tournament Creation`);
    console.log(`  - 5 Player Registrations`);
    console.log(`  - 1 Tournament Start`);
    console.log(`  - 1 Results Submission`);
    console.log(`  - 1 Prize Distribution`);

    // Save results to file
    const report = `
ESPOTZ TOURNAMENT SMART CONTRACT - FULL USER FLOW TEST RESULTS
================================================================

Test Date: ${new Date().toISOString()}
Network: Solana Devnet
Program ID: ${PROGRAM_ID.toString()}

Tournament Configuration:
- Entry Fee: 0.0003 SOL
- Max Players: 5
- Total Prize Pool: 0.0015 SOL (5 × 0.0003)

Transaction Hashes:
===================

1. TOURNAMENT CREATION
   Hash: ${transactionHashes.tournamentCreation}
   Explorer: https://explorer.solana.com/tx/${transactionHashes.tournamentCreation}?cluster=devnet

2. PLAYER REGISTRATIONS
${transactionHashes.playerRegistrations.map((tx, i) => `   Player ${i + 1}:
     Hash: ${tx}
     Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`).join('\n')}

3. TOURNAMENT START
   Hash: ${transactionHashes.tournamentStart}
   Explorer: https://explorer.solana.com/tx/${transactionHashes.tournamentStart}?cluster=devnet

4. RESULTS SUBMISSION
   Hash: ${transactionHashes.resultsSubmission}
   Explorer: https://explorer.solana.com/tx/${transactionHashes.resultsSubmission}?cluster=devnet

5. PRIZE DISTRIBUTION
   Hash: ${transactionHashes.prizeDistribution}
   Explorer: https://explorer.solana.com/tx/${transactionHashes.prizeDistribution}?cluster=devnet

User Flows Tested:
==================
✓ Tournament Operator creating tournament
✓ 5 players registering and paying registration fee
✓ Tournament Operator starting tournament
✓ Tournament Operator submitting results
✓ Tournament Operator distributing winnings via contract

Total Transactions: 9 (all successful)
`;

    fs.writeFileSync("FULL_FLOW_TEST_RESULTS.txt", report);
    console.log(`\n✓ Full report saved to: FULL_FLOW_TEST_RESULTS.txt`);

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  }
}

main();
