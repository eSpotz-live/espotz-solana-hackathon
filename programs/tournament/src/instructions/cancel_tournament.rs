use anchor_lang::prelude::*;

use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct CancelTournament<'info> {
    #[account(
        mut,
        constraint = tournament.admin == admin.key() @ TournamentError::Unauthorized,
        constraint = tournament.status != TournamentStatus::Ended @ TournamentError::CannotCancelAfterEnd,
        constraint = tournament.status != TournamentStatus::Completed @ TournamentError::CannotCancelAfterEnd,
    )]
    pub tournament: Account<'info, Tournament>,

    pub admin: Signer<'info>,
}

pub fn handler(ctx: Context<CancelTournament>) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    let clock = Clock::get()?;

    // Update status to Cancelled
    tournament.status = TournamentStatus::Cancelled;

    emit!(TournamentCancelled {
        tournament: tournament.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct TournamentCancelled {
    pub tournament: Pubkey,
    pub timestamp: i64,
}
