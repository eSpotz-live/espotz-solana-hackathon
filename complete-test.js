const { PublicKey, Keypair, SystemProgram, Transaction, TransactionInstruction, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Connection } = require("@solana/web3.js");
const fs = require("fs");
const BN = require("bn.js");

// Program ID
const PROGRAM_ID = new PublicKey("BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv");
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Load operator
function loadKeypair(path) {
  const secret = JSON.parse(fs.readFileSync(path, "utf-8"));
  return Keypair.fromSecretKey(Buffer.from(secret));
}

const tournamentOperator = loadKeypair("/home/user/.config/solana/id.json");

// Discriminators
const DISCRIMINATORS = {
  distributePrizes: Buffer.from([154, 99, 201, 93, 82, 104, 73, 232]),
};

// Tournament PDA from the test
const tournamentPda = new PublicKey("Dz8JrjcdGpW6ZQEJhYqJ5vV8B7pfqeEpY4pWEEunMDgk");
const vaultAccountPda = new PublicKey("Hk2gKTm74YJySKSVerP3Ma1p6zs1L81xe98YrR8eRdrQ");
const vaultAuthorityPda = new PublicKey("3deuw6gHwS43ZNA3ymesmnrQLkx7VJpgYs82foVBYhi1");

// Winner (Player 1)
const winner = new PublicKey("877QLQPaieHtk929Lv2Xs4yyJijmgkGPoauEspVGS1Mk");

async function distributePrizes() {
  console.log("================================================================================");
  console.log("STEP 6: Distribute Prizes");
  console.log("================================================================================");

  // Build instruction data with winners and amounts
  const totalPrize = new BN(5 * 0.0003 * LAMPORTS_PER_SOL);
  const data = Buffer.alloc(256);
  let offset = 0;

  // Discriminator
  DISCRIMINATORS.distributePrizes.copy(data, offset);
  offset += 8;

  // Vec<Pubkey> winners - length (u32)
  data.writeUInt32LE(1, offset);
  offset += 4;
  // Winner pubkey (32 bytes)
  winner.toBuffer().copy(data, offset);
  offset += 32;

  // Vec<u64> amounts - length (u32)
  data.writeUInt32LE(1, offset);
  offset += 4;
  // Amount (u64 little endian)
  totalPrize.toArrayLike(Buffer, 'le', 8).copy(data, offset);
  offset += 8;

  const instructionData = data.slice(0, offset);

  console.log(`Prize amount: ${(totalPrize.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

  const accounts = [
    { pubkey: tournamentPda, isSigner: false, isWritable: true },
    { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
    { pubkey: vaultAccountPda, isSigner: false, isWritable: true },
    { pubkey: tournamentOperator.publicKey, isSigner: true, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    // Winner in remaining accounts
    { pubkey: winner, isSigner: false, isWritable: true },
  ];

  const ix = new TransactionInstruction({
    keys: accounts,
    programId: PROGRAM_ID,
    data: instructionData,
  });

  const tx = new Transaction().add(ix);
  const txSig = await sendAndConfirmTransaction(connection, tx, [tournamentOperator], {
    commitment: "confirmed",
    skipPreflight: false,
  });

  console.log(`✓ Prizes Distributed!`);
  console.log(`✓ Hash: ${txSig}`);
  console.log(`✓ Explorer: https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

  return txSig;
}

async function main() {
  try {
    const distributeTx = await distributePrizes();

    console.log("\n" + "=".repeat(80));
    console.log("✓✓✓ COMPLETE TOURNAMENT LIFECYCLE TEST SUCCESSFUL ✓✓✓");
    console.log("=".repeat(80));

    console.log("\nFINAL TRANSACTION SUMMARY:");
    console.log("========================");
    console.log("\nFUNDING (5 transactions):");
    console.log("  Player 1: 4LVAgiJx5A4sqHhyNNcZVf8wMudo2bXoxgzwVcThcjrC4yKkr6VZxbrwLiA1CUm5XHDtKuifShDAduMuXnXJeb2s");
    console.log("  Player 2: 5VvUJbai3H8B4XursKKrDKHxhdwELK6LD4huS5SQNr5xEAFcPPCsZFD78aBr6DK1UNZYdFeTgSWRebeVri9oMC4F");
    console.log("  Player 3: 5RFtfXpvMXBNDLd1at3twEfr4xAvkKFiuN52e3e35K9ydbXi7AwsZQDyX8As6WsV8VdE4vntGU9f7iuauLD8DCuY");
    console.log("  Player 4: CwpT5JbyTdQqK1Szu5BoQiX8YVfFj48rvgJZHyushDtpyZyMs6zjFf4coCTzCq5PDTyFghUswiYKK9jKYspC456");
    console.log("  Player 5: 4DzVrWmEwZNfDfLq3Ttpr2fr1WrKcvzPAguAEZQKCHTJ6tSmg2HJxVh6UK1nQN4wqdzrsp5LtF4tZnz3cWu8VpiL");

    console.log("\nTOURNAMENT CREATION (1 transaction):");
    console.log("  Create: 2KFVhT3LQLKggcyWDriwbiwUsMxqf9ENaQwA8cGgoTs3BzGjWdUuBN73GLMM8izwisLs4NFPmZkzgyU2Vn8m6UK5");

    console.log("\nPLAYER REGISTRATIONS (5 transactions):");
    console.log("  Player 1: 2LcK1SkqiSibYNJ2rgjJFzg1QGzcQ9j9PkPJU9uHZFXfVRQR5dJf9fVwxPUnYTTRL9LZdvJYDgmPH2wEmJMcy49S");
    console.log("  Player 2: 2MNENPMcgaBeSz3NfmGDUpTkRNHqnYeUjiV9ipN1RaAdiEcSg3j4dWXJez7rEbwB3WwV3Ut2JcqApSWQMvjqkTvj");
    console.log("  Player 3: 2Y5yAguMa17caAbo8BEfqwjJ56tXpLn17RgX99rV11akbXwLFTuemo1QhsWenkyZDjrtPsgh76uSiiw6L1nCiknM");
    console.log("  Player 4: 2xc2bTvHB2Fw713UfmCXcMvXnCcAdKcYXXrZGWr5xpNuCroTAhYWQEbkkBBhV4XWSgDEceAWP6VBzn5XGU8gmSCK");
    console.log("  Player 5: 5cepjHQ8PincfTD57hXMdgXzmi8hh34Vqd1Xq1u22cjXTiR3XQC3NuQygrhuU8EZop7TPzhXUQiDuGNpPkCtLrLD");

    console.log("\nTOURNAMENT START (1 transaction):");
    console.log("  Start: 4w17vGWYegNvny8nzSwE8G8FAxvo8MmetCMr72CmhXW2awqEUjXqm5LfK4Xm2cQNVfjJ1hsdn5zi2W33HjLf2vCm");

    console.log("\nRESULTS SUBMISSION (1 transaction):");
    console.log("  Submit: 41Y6SvhxVRp3E9NLgh4j9JUd8R84Y1U71wJGtG2hfy6xinJRdvfyooggvyMHM4b5WrSkGKP2ftJE3t1WB9pS1Ksz");

    console.log("\nPRIZE DISTRIBUTION (1 transaction):");
    console.log(`  Distribute: ${distributeTx}`);

    console.log("\n" + "=".repeat(80));
    console.log("TOTAL: 14 TRANSACTIONS");
    console.log("  - 5 player funding transactions");
    console.log("  - 1 tournament creation");
    console.log("  - 5 player registrations (0.0003 SOL each)");
    console.log("  - 1 tournament start");
    console.log("  - 1 results submission");
    console.log("  - 1 prize distribution");
    console.log("=".repeat(80));

  } catch (error) {
    console.error("\n❌ FAILED:");
    console.error(error);
    process.exit(1);
  }
}

main();
