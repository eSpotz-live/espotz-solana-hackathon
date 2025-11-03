use anchor_lang::prelude::*;

use crate::errors::PredictionMarketError;
use crate::state::{MarketStatus, PredictionMarket};

pub fn close_market(ctx: Context<CloseMarket>) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let clock = Clock::get()?;

    // Validate market can be closed
    require!(
        market.status == MarketStatus::Open,
        PredictionMarketError::MarketNotOpen
    );

    require!(
        clock.unix_timestamp >= market.closes_at,
        PredictionMarketError::MarketNotClosed
    );

    // Close market for betting
    market.status = MarketStatus::Closed;

    msg!("Market closed for betting");
    msg!("Waiting for oracle settlement");

    Ok(())
}

#[derive(Accounts)]
pub struct CloseMarket<'info> {
    #[account(
        mut,
        has_one = admin
    )]
    pub market: Account<'info, PredictionMarket>,

    pub admin: Signer<'info>,
}
