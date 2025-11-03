use anchor_lang::prelude::*;

use crate::state::{Outcome, PredictionMarket, UserPosition};

pub fn init_position(
    ctx: Context<InitPosition>,
    outcome: Outcome,
) -> Result<()> {
    let position = &mut ctx.accounts.position;
    let clock = Clock::get()?;

    position.market = ctx.accounts.market.key();
    position.user = ctx.accounts.user.key();
    position.outcome = outcome;
    position.amount = 0;
    position.shares = 0;
    position.claimed = false;
    position.created_at = clock.unix_timestamp;
    position.bump = ctx.bumps.position;

    msg!("Position initialized for user");
    msg!("Market: {}", position.market);
    msg!("Outcome: {:?}", outcome);

    Ok(())
}

#[derive(Accounts)]
pub struct InitPosition<'info> {
    pub market: Account<'info, PredictionMarket>,

    #[account(
        init,
        payer = user,
        space = UserPosition::LEN,
        seeds = [b"user-position", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
