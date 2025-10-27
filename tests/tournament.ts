import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Tournament } from "../target/types/tournament";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("tournament", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Tournament as Program<Tournament>;

  // Test accounts
  let usdcMint: PublicKey;
  let admin: Keypair;
  let player1: Keypair;
  let player2: Keypair;
  let player3: Keypair;
  let tournamentId: number;

  before(async () => {
    admin = Keypair.generate();
    player1 = Keypair.generate();
    player2 = Keypair.generate();
    player3 = Keypair.generate();
    tournamentId = Math.floor(Math.random() * 1000000);

    // Airdrop SOL to test wallets
    await provider.connection.requestAirdrop(admin.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(player1.publicKey, 5 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(player2.publicKey, 5 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(player3.publicKey, 5 * LAMPORTS_PER_SOL);

    // Wait for airdrops to confirm
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create USDC mint (for testing)
    usdcMint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      6 // USDC has 6 decimals
    );

    console.log("Test setup complete");
    console.log("USDC Mint:", usdcMint.toBase58());
    console.log("Admin:", admin.publicKey.toBase58());
    console.log("Tournament ID:", tournamentId);
  });

  it("Creates a tournament", async () => {
    const [tournamentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tournament"), new anchor.BN(tournamentId).toArrayLike(Buffer, "le", 4)],
      program.programId
    );

    const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-authority"), tournamentPda.toBuffer()],
      program.programId
    );

    const [vaultTokenPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-token"), tournamentPda.toBuffer()],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 300; // 5 minutes from now
    const endTime = startTime + 3600; // 1 hour tournament

    const tx = await program.methods
      .createTournament(
        tournamentId,
        { fortnite: {} }, // GameType enum
        new anchor.BN(10_000_000), // 10 USDC entry fee (6 decimals)
        100, // max players
        new anchor.BN(startTime),
        new anchor.BN(endTime)
      )
      .accounts({
        tournament: tournamentPda,
        vaultAuthority: vaultAuthorityPda,
        vaultTokenAccount: vaultTokenPda,
        usdcMint: usdcMint,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin])
      .rpc();

    console.log("Tournament created:", tx);

    // Fetch and verify tournament account
    const tournament = await program.account.tournament.fetch(tournamentPda);
    assert.equal(tournament.id, tournamentId);
    assert.equal(tournament.admin.toBase58(), admin.publicKey.toBase58());
    assert.equal(tournament.maxPlayers, 100);
    assert.equal(tournament.currentPlayers, 0);
    assert.equal(tournament.prizePool.toNumber(), 0);
  });

  it("Registers players for tournament", async () => {
    const [tournamentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tournament"), new anchor.BN(tournamentId).toArrayLike(Buffer, "le", 4)],
      program.programId
    );

    const [vaultTokenPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-token"), tournamentPda.toBuffer()],
      program.programId
    );

    // Create token accounts for players and mint USDC
    const player1TokenAccount = await createAccount(
      provider.connection,
      player1,
      usdcMint,
      player1.publicKey
    );

    const player2TokenAccount = await createAccount(
      provider.connection,
      player2,
      usdcMint,
      player2.publicKey
    );

    // Mint USDC to players
    await mintTo(
      provider.connection,
      admin,
      usdcMint,
      player1TokenAccount,
      admin,
      100_000_000 // 100 USDC
    );

    await mintTo(
      provider.connection,
      admin,
      usdcMint,
      player2TokenAccount,
      admin,
      100_000_000 // 100 USDC
    );

    // Register player 1
    const [player1EntryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player-entry"), tournamentPda.toBuffer(), player1.publicKey.toBuffer()],
      program.programId
    );

    const tx1 = await program.methods
      .registerPlayer()
      .accounts({
        tournament: tournamentPda,
        playerEntry: player1EntryPda,
        playerTokenAccount: player1TokenAccount,
        vaultTokenAccount: vaultTokenPda,
        player: player1.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([player1])
      .rpc();

    console.log("Player 1 registered:", tx1);

    // Register player 2
    const [player2EntryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player-entry"), tournamentPda.toBuffer(), player2.publicKey.toBuffer()],
      program.programId
    );

    const tx2 = await program.methods
      .registerPlayer()
      .accounts({
        tournament: tournamentPda,
        playerEntry: player2EntryPda,
        playerTokenAccount: player2TokenAccount,
        vaultTokenAccount: vaultTokenPda,
        player: player2.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([player2])
      .rpc();

    console.log("Player 2 registered:", tx2);

    // Verify tournament state
    const tournament = await program.account.tournament.fetch(tournamentPda);
    assert.equal(tournament.currentPlayers, 2);
    assert.equal(tournament.prizePool.toNumber(), 20_000_000); // 20 USDC

    // Verify vault balance
    const vaultAccount = await getAccount(provider.connection, vaultTokenPda);
    assert.equal(vaultAccount.amount.toString(), "20000000");
  });

  it("Starts tournament", async () => {
    const [tournamentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tournament"), new anchor.BN(tournamentId).toArrayLike(Buffer, "le", 4)],
      program.programId
    );

    // Wait for start time (in real scenario)
    // For testing, we'll modify the start time or skip this in test environment

    const tx = await program.methods
      .startTournament()
      .accounts({
        tournament: tournamentPda,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    console.log("Tournament started:", tx);

    const tournament = await program.account.tournament.fetch(tournamentPda);
    assert.equal(tournament.status.active !== undefined, true);
  });

  it("Submits results", async () => {
    const [tournamentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tournament"), new anchor.BN(tournamentId).toArrayLike(Buffer, "le", 4)],
      program.programId
    );

    // Simulate tournament end (in real scenario, wait for end time)
    const winners = [player1.publicKey, player2.publicKey];

    const tx = await program.methods
      .submitResults(winners)
      .accounts({
        tournament: tournamentPda,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    console.log("Results submitted:", tx);

    const tournament = await program.account.tournament.fetch(tournamentPda);
    assert.equal(tournament.status.ended !== undefined, true);
  });

  it("Distributes prizes", async () => {
    const [tournamentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tournament"), new anchor.BN(tournamentId).toArrayLike(Buffer, "le", 4)],
      program.programId
    );

    const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-authority"), tournamentPda.toBuffer()],
      program.programId
    );

    const [vaultTokenPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-token"), tournamentPda.toBuffer()],
      program.programId
    );

    // Get player token accounts
    const player1TokenAccount = await createAccount(
      provider.connection,
      player1,
      usdcMint,
      player1.publicKey
    );

    const player2TokenAccount = await createAccount(
      provider.connection,
      player2,
      usdcMint,
      player2.publicKey
    );

    const winners = [player1.publicKey, player2.publicKey];
    const amounts = [new anchor.BN(12_000_000), new anchor.BN(8_000_000)]; // 60/40 split

    const tx = await program.methods
      .distributePrizes(winners, amounts)
      .accounts({
        tournament: tournamentPda,
        vaultAuthority: vaultAuthorityPda,
        vaultTokenAccount: vaultTokenPda,
        admin: admin.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .remainingAccounts([
        { pubkey: player1TokenAccount, isWritable: true, isSigner: false },
        { pubkey: player2TokenAccount, isWritable: true, isSigner: false },
      ])
      .signers([admin])
      .rpc();

    console.log("Prizes distributed:", tx);

    const tournament = await program.account.tournament.fetch(tournamentPda);
    assert.equal(tournament.status.completed !== undefined, true);

    // Verify winner balances
    const player1Balance = await getAccount(provider.connection, player1TokenAccount);
    assert.equal(player1Balance.amount.toString(), "12000000");
  });

  it("Cancels tournament and claims refund", async () => {
    // Create a new tournament for cancellation test
    const cancelTournamentId = tournamentId + 1;

    const [cancelTournamentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("tournament"), new anchor.BN(cancelTournamentId).toArrayLike(Buffer, "le", 4)],
      program.programId
    );

    const [cancelVaultAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-authority"), cancelTournamentPda.toBuffer()],
      program.programId
    );

    const [cancelVaultTokenPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault-token"), cancelTournamentPda.toBuffer()],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);

    // Create tournament
    await program.methods
      .createTournament(
        cancelTournamentId,
        { fortnite: {} },
        new anchor.BN(5_000_000),
        50,
        new anchor.BN(now + 300),
        new anchor.BN(now + 3900)
      )
      .accounts({
        tournament: cancelTournamentPda,
        vaultAuthority: cancelVaultAuthorityPda,
        vaultTokenAccount: cancelVaultTokenPda,
        usdcMint: usdcMint,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin])
      .rpc();

    // Register player 3
    const player3TokenAccount = await createAccount(
      provider.connection,
      player3,
      usdcMint,
      player3.publicKey
    );

    await mintTo(
      provider.connection,
      admin,
      usdcMint,
      player3TokenAccount,
      admin,
      50_000_000
    );

    const [player3EntryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("player-entry"), cancelTournamentPda.toBuffer(), player3.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .registerPlayer()
      .accounts({
        tournament: cancelTournamentPda,
        playerEntry: player3EntryPda,
        playerTokenAccount: player3TokenAccount,
        vaultTokenAccount: cancelVaultTokenPda,
        player: player3.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([player3])
      .rpc();

    // Cancel tournament
    const cancelTx = await program.methods
      .cancelTournament()
      .accounts({
        tournament: cancelTournamentPda,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    console.log("Tournament cancelled:", cancelTx);

    // Claim refund
    const refundTx = await program.methods
      .claimRefund()
      .accounts({
        tournament: cancelTournamentPda,
        playerEntry: player3EntryPda,
        vaultAuthority: cancelVaultAuthorityPda,
        vaultTokenAccount: cancelVaultTokenPda,
        playerTokenAccount: player3TokenAccount,
        player: player3.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([player3])
      .rpc();

    console.log("Refund claimed:", refundTx);

    // Verify refund
    const player3Balance = await getAccount(provider.connection, player3TokenAccount);
    assert.equal(player3Balance.amount.toString(), "50000000"); // Full refund
  });
});
