use anchor_lang::prelude::*;

use crate::errors::PredictionMarketError;
use crate::state::{MarketStatus, Outcome, PredictionMarket};

pub fn settle_market(
    ctx: Context<SettleMarket>,
    winning_outcome: Outcome,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let clock = Clock::get()?;

    // Validate market can be settled
    require!(
        market.status == MarketStatus::Open || market.status == MarketStatus::Closed,
        PredictionMarketError::MarketAlreadySettled
    );

    require!(
        clock.unix_timestamp >= market.closes_at,
        PredictionMarketError::MarketNotClosed
    );

    // Update market with settlement
    // NOTE: In production, this would verify Switchboard oracle data
    // For MVP, admin manually submits the winning outcome
    market.status = MarketStatus::Settled;
    market.winning_outcome = Some(winning_outcome);
    market.settled_at = Some(clock.unix_timestamp);

    msg!("Market settled manually");
    msg!("Winning outcome: {:?}", winning_outcome);
    msg!("Total pool: {} lamports", market.yes_pool + market.no_pool);

    Ok(())
}

#[derive(Accounts)]
pub struct SettleMarket<'info> {
    #[account(
        mut,
        has_one = admin
    )]
    pub market: Account<'info, PredictionMarket>,

    pub admin: Signer<'info>,
}
