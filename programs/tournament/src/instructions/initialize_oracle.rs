use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

/// Initialize Switchboard oracle for a tournament
#[derive(Accounts)]
pub struct InitializeOracle<'info> {
    #[account(
        constraint = tournament.admin == admin.key() @ TournamentError::Unauthorized,
    )]
    pub tournament: Account<'info, Tournament>,

    #[account(
        init,
        payer = admin,
        space = TournamentOracle::LEN,
        seeds = [b"tournament-oracle", tournament.key().as_ref()],
        bump
    )]
    pub tournament_oracle: Account<'info, TournamentOracle>,

    /// Switchboard pull feed account
    /// CHECK: This is validated by Switchboard SDK
    pub oracle_feed: AccountInfo<'info>,

    /// Switchboard oracle queue account
    /// CHECK: This is validated by Switchboard SDK
    pub oracle_queue: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeOracle>) -> Result<()> {
    let tournament_oracle = &mut ctx.accounts.tournament_oracle;

    tournament_oracle.tournament = ctx.accounts.tournament.key();
    tournament_oracle.oracle_feed = ctx.accounts.oracle_feed.key();
    tournament_oracle.oracle_queue = ctx.accounts.oracle_queue.key();
    tournament_oracle.is_initialized = true;
    tournament_oracle.last_verification_timestamp = 0;
    tournament_oracle.verified_winner = Pubkey::default();
    tournament_oracle.bump = ctx.bumps.tournament_oracle;

    emit!(OracleInitialized {
        tournament: ctx.accounts.tournament.key(),
        oracle_feed: ctx.accounts.oracle_feed.key(),
        oracle_queue: ctx.accounts.oracle_queue.key(),
    });

    Ok(())
}

#[event]
pub struct OracleInitialized {
    pub tournament: Pubkey,
    pub oracle_feed: Pubkey,
    pub oracle_queue: Pubkey,
}
