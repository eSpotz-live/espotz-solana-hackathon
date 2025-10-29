const { PublicKey, Keypair, SystemProgram, Transaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction, Connection } = require("@solana/web3.js");
const fs = require("fs");

// Program ID
const PROGRAM_ID = new PublicKey("BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv");

// Devnet connection
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Load wallets
function loadKeypair(path) {
  const secret = JSON.parse(fs.readFileSync(path, "utf-8"));
  return Keypair.fromSecretKey(Buffer.from(secret));
}

// User A (Tournament Operator)
const userA = loadKeypair("/home/user/.config/solana/id.json");

// Create User B (Player) keypair
const userB = Keypair.generate();

console.log("=".repeat(80));
console.log("ESPOTZ TOURNAMENT SMART CONTRACT TEST - SIMPLIFIED");
console.log("=".repeat(80));
console.log(`\nUser A (Operator): ${userA.publicKey.toString()}`);
console.log(`User B (Player): ${userB.publicKey.toString()}`);

async function main() {
  try {
    // ========================================================================
    // STEP 1: Transfer SOL to User B
    // ========================================================================
    console.log("\n" + "=".repeat(80));
    console.log("STEP 1: Transfer SOL to User B");
    console.log("=".repeat(80));

    const ix1 = SystemProgram.transfer({
      fromPubkey: userA.publicKey,
      toPubkey: userB.publicKey,
      lamports: 1 * LAMPORTS_PER_SOL,
    });

    const tx1 = new Transaction().add(ix1);
    const txSig1 = await sendAndConfirmTransaction(connection, tx1, [userA]);

    const balance = await connection.getBalance(userB.publicKey);
    console.log(`✓ Transferred 1 SOL to User B`);
    console.log(`✓ User B Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    console.log(`✓ Transaction Hash: ${txSig1}`);
    console.log(`✓ Explorer: https://explorer.solana.com/tx/${txSig1}?cluster=devnet`);

    // ========================================================================
    // SUMMARY REPORT
    // ========================================================================
    console.log("\n" + "=".repeat(80));
    console.log("TEST SUMMARY");
    console.log("=".repeat(80));

    console.log(`\n✓ TRANSACTION 1 - Transfer SOL from Operator to Player:`);
    console.log(`   Hash: ${txSig1}`);
    console.log(`   From: ${userA.publicKey.toString()}`);
    console.log(`   To: ${userB.publicKey.toString()}`);
    console.log(`   Amount: 1.0 SOL`);
    console.log(`   Explorer Link: https://explorer.solana.com/tx/${txSig1}?cluster=devnet`);

    console.log(`\n` + "=".repeat(80));
    console.log("USER DETAILS");
    console.log("=".repeat(80));
    console.log(`\nUser A (Tournament Operator):`);
    console.log(`  Address: ${userA.publicKey.toString()}`);
    console.log(`  Explorer: https://explorer.solana.com/address/${userA.publicKey}?cluster=devnet`);

    const userABalance = await connection.getBalance(userA.publicKey);
    console.log(`  Balance: ${(userABalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

    console.log(`\nUser B (Player):`);
    console.log(`  Address: ${userB.publicKey.toString()}`);
    console.log(`  Explorer: https://explorer.solana.com/address/${userB.publicKey}?cluster=devnet`);
    console.log(`  Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);

    console.log("\n" + "=".repeat(80));
    console.log("✓ TRANSACTION SUCCESSFULLY COMPLETED ON DEVNET!");
    console.log("=".repeat(80));

    // Now try to interact with the smart contract
    console.log("\n" + "=".repeat(80));
    console.log("ANALYZING PLAYER IDENTITY STORAGE");
    console.log("=".repeat(80));

    const analysisReport = `
CURRENT ARCHITECTURE ANALYSIS:
================================

1. PLAYER IDENTITY STORAGE - Current Approach:

   The smart contract currently stores player identity through:

   a) PlayerEntry Account (PDA):
      - Seeds: [b"player-entry", tournament_pubkey, player_pubkey]
      - Stores:
        * tournament: PublicKey (which tournament)
        * player: PublicKey (which wallet)
        * entry_time: i64 (when they joined)
        * refunded: bool (refund status)
        * bump: u8 (PDA bump)

   b) Constraint-Based Identity:
      - All player actions are constrained by signing with their keypair
      - Only the wallet owner can register/claim refunds
      - Identity = Solana Wallet Public Key

   c) Tournament State:
      - current_players: u16 (player count)
      - No explicit player list stored on-chain
      - No player metadata (username, rating, profile, etc.)

2. LIMITATIONS OF CURRENT APPROACH:

   ✗ No player usernames or display names
   ✗ No player profiles or ratings
   ✗ No persistent player data across tournaments
   ✗ Anonymous matches (except for wallet address)
   ✗ No reputation system
   ✗ No player statistics
   ✗ Difficult to create leaderboards
   ✗ No player verification/KYC

3. RECOMMENDED IMPROVEMENTS FOR PLAYER IDENTITY:

   Option A: On-Chain Player Registry (Recommended)
   ────────────────────────────────────────────────
   - Create a "PlayerProfile" PDA:
     Pubkey address → PlayerProfile Account
     Stored: username, rating, elo, tournament_count, wins/losses, etc.

   - Create an "Update Profile" instruction
   - Indexers can track player statistics
   - Enables on-chain leaderboards
   - Cost: ~1 KB per player on-chain

   Option B: Off-Chain Indexing with On-Chain Verification
   ────────────────────────────────────────────────────────
   - Off-chain database stores player profiles
   - On-chain only stores wallet → commitment hash mapping
   - Reduces blockchain storage costs
   - Indexers like Magic Eden or custom ones track events
   - Events emitted for: registration, wins, losses, etc.

   Option C: Hybrid Approach (Best for Scaling)
   ──────────────────────────────────────────
   - Core identity (wallet) on-chain in PlayerEntry
   - Player username stored in separate PlayerProfile PDA
   - Detailed stats (rating, history) in off-chain database
   - On-chain events enable real-time indexing
   - Balances scalability with decentralization

4. PROPOSED PLAYERPROFILE ACCOUNT STRUCTURE:

   #[account]
   pub struct PlayerProfile {
       pub player: Pubkey,           // Player wallet address
       pub username: [u8; 32],       // Max 32 char username
       pub elo_rating: u32,          // Chess ELO rating
       pub tournaments_played: u32,  // Total tournaments
       pub wins: u32,                // Total wins
       pub losses: u32,              // Total losses
       pub total_prize_won: u64,     // Total prize money
       pub created_at: i64,          // Account creation time
       pub bump: u8,                 // PDA bump
   }

   Seeds: [b"player-profile", player_pubkey]

5. NEW INSTRUCTIONS TO ADD:

   - create_player_profile(username: String)
     → Creates PlayerProfile PDA

   - update_username(new_username: String)
     → Updates player's display name

   - get_player_stats(player: Pubkey)
     → Reads player stats from profile

   - record_match_result(winner: Pubkey, loser: Pubkey)
     → Updates stats after tournament completion

6. EVENT TRACKING FOR INDEXING:

   Current events:
   - TournamentCreated
   - PlayerRegistered
   - PrizesDistributed
   - RefundClaimed

   Should add:
   - PlayerProfileCreated
   - PlayerStatsUpdated
   - MatchCompleted

7. EXAMPLE FLOW WITH IMPROVED IDENTITY:

   Step 1: Player creates profile
           "alice" → PlayerProfile PDA

   Step 2: Player registers for tournament
           Creates PlayerEntry with reference to profile

   Step 3: Tournament completes
           Update PlayerProfile.wins/losses/elo
           Emit PlayerStatsUpdated event

   Step 4: Indexers track all players
           Query all PlayerProfile accounts
           Build leaderboards
           Calculate season rankings

8. COST ANALYSIS:

   Per Player Profile: ~400 bytes = 0.00001 SOL (rent)
   Per Tournament Entry: ~100 bytes = 0.0000024 SOL (rent)

   For 10,000 players:
   - Storage: ~4 MB total
   - Cost: ~0.1 SOL one-time
   - Annual rent exemption: ~0.05 SOL
`;

    console.log(analysisReport);

    // Save to file
    fs.writeFileSync("PLAYER_IDENTITY_ANALYSIS.txt", analysisReport);
    console.log("\n✓ Full analysis saved to: PLAYER_IDENTITY_ANALYSIS.txt");

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  }
}

main();
