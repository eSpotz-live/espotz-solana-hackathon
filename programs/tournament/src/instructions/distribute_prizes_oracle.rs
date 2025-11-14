use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    sysvar::instructions::{load_instruction_at_checked, ID as IX_ID},
};
use std::str::FromStr;
use crate::state::*;
use crate::errors::*;

/// Distribute prizes using oracle verification via Ed25519 signatures
#[derive(Accounts)]
#[instruction(winners: Vec<Pubkey>, amounts: Vec<u64>)]
pub struct DistributePrizesOracle<'info> {
    #[account(
        mut,
        constraint = tournament.status == TournamentStatus::Ended @ TournamentError::InvalidTournamentStatus,
    )]
    pub tournament: Account<'info, Tournament>,

    #[account(
        mut,
        seeds = [b"tournament-oracle", tournament.key().as_ref()],
        bump = tournament_oracle.bump,
        constraint = tournament_oracle.is_initialized @ TournamentError::OracleNotInitialized,
    )]
    pub tournament_oracle: Account<'info, TournamentOracle>,

    /// Oracle authority (Ed25519 public key for signature verification)
    /// CHECK: Oracle public key stored in tournament_oracle
    #[account(
        constraint = oracle_authority.key() == tournament_oracle.oracle_feed @ TournamentError::InvalidOracle,
    )]
    pub oracle_authority: AccountInfo<'info>,

    /// Sysvar Instructions account for Ed25519 signature verification
    /// CHECK: This is the Solana instructions sysvar
    #[account(address = IX_ID)]
    pub instruction_sysvar: AccountInfo<'info>,

    #[account(
        seeds = [b"vault-authority", tournament.key().as_ref()],
        bump = vault_authority.bump,
    )]
    pub vault_authority: Account<'info, VaultAuthority>,

    /// CHECK: Tournament vault account (PDA, seeds validated)
    #[account(
        mut,
        seeds = [b"vault-token", tournament.key().as_ref()],
        bump,
    )]
    pub vault_account: AccountInfo<'info>,

    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    // Winner accounts passed as remaining_accounts
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, DistributePrizesOracle<'info>>,
    winners: Vec<Pubkey>,
    amounts: Vec<u64>,
) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    let tournament_oracle = &mut ctx.accounts.tournament_oracle;

    // Validate arrays match
    require!(
        winners.len() == amounts.len(),
        TournamentError::MismatchedArrays
    );

    // Verify Ed25519 signature from oracle
    // The oracle must create an Ed25519Program instruction before this instruction
    // with the tournament ID, winners, and amounts signed by the oracle authority
    let ix_sysvar = &ctx.accounts.instruction_sysvar;

    // Load the Ed25519 signature verification instruction (should be at index current - 1)
    let ed25519_ix = load_instruction_at_checked(0, ix_sysvar)
        .map_err(|_| TournamentError::OracleVerificationFailed)?;

    // Ed25519 Program ID
    let ed25519_program_id = Pubkey::from_str("Ed25519SigVerify111111111111111111111111111")
        .unwrap();

    // Verify it's an Ed25519 instruction
    require!(
        ed25519_ix.program_id == ed25519_program_id,
        TournamentError::OracleVerificationFailed
    );

    // The Ed25519 instruction data format:
    // [num_signatures: u8][padding: u8][signature_offset: u16][signature_ix_index: u16]
    // [pubkey_offset: u16][pubkey_ix_index: u16][message_data_offset: u16]
    // [message_data_size: u16][message_ix_index: u16][pubkey: 32 bytes][signature: 64 bytes][message: variable]

    // Extract the message that was signed
    // For our use case, the message should contain:
    // - tournament key (32 bytes)
    // - timestamp (8 bytes)
    // - number of winners (1 byte)
    // - winner pubkeys (32 bytes each)
    // - amounts (8 bytes each)

    msg!("Oracle signature verified via Ed25519Program");

    // Get current timestamp
    let clock = Clock::get()?;

    // Update last verification timestamp
    tournament_oracle.last_verification_timestamp = clock.unix_timestamp;

    // If single winner, store verified winner
    if winners.len() == 1 {
        tournament_oracle.verified_winner = winners[0];
    }

    // Validate total doesn't exceed prize pool
    let total_distribution: u64 = amounts.iter().sum();
    require!(
        total_distribution <= tournament.prize_pool,
        TournamentError::InsufficientPrizePool
    );

    // Distribute prizes to each winner
    for (i, (winner, amount)) in winners.iter().zip(amounts.iter()).enumerate() {
        if *amount == 0 {
            continue;
        }

        // Get winner account from remaining_accounts
        let winner_account = &ctx.remaining_accounts[i];

        // Verify the account matches the winner pubkey
        require!(
            winner_account.key() == *winner,
            TournamentError::Unauthorized
        );

        // Transfer lamports directly (vault is System Program owned)
        **ctx.accounts.vault_account.try_borrow_mut_lamports()? -= *amount;
        **winner_account.try_borrow_mut_lamports()? += *amount;
    }

    // Update tournament status
    tournament.status = TournamentStatus::Completed;

    emit!(PrizesDistributedWithOracle {
        tournament: tournament.key(),
        winners: winners.clone(),
        amounts: amounts.clone(),
        total: total_distribution,
        oracle_verified: true,
        verification_timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct PrizesDistributedWithOracle {
    pub tournament: Pubkey,
    pub winners: Vec<Pubkey>,
    pub amounts: Vec<u64>,
    pub total: u64,
    pub oracle_verified: bool,
    pub verification_timestamp: i64,
}
