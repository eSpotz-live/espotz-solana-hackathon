use anchor_lang::prelude::*;

use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct SubmitResults<'info> {
    #[account(
        mut,
        constraint = tournament.admin == admin.key() @ TournamentError::Unauthorized,
        constraint = tournament.status == TournamentStatus::Active @ TournamentError::InvalidTournamentStatus,
    )]
    pub tournament: Account<'info, Tournament>,

    pub admin: Signer<'info>,
}

pub fn handler(
    ctx: Context<SubmitResults>,
    winners: Vec<Pubkey>,
) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    let clock = Clock::get()?;

    // Validate tournament has ended
    require!(
        clock.unix_timestamp >= tournament.end_time,
        TournamentError::TournamentNotEnded
    );

    // Update status to Ended (ready for prize distribution)
    tournament.status = TournamentStatus::Ended;

    emit!(ResultsSubmitted {
        tournament: tournament.key(),
        winners: winners.clone(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct ResultsSubmitted {
    pub tournament: Pubkey,
    pub winners: Vec<Pubkey>,
    pub timestamp: i64,
}
