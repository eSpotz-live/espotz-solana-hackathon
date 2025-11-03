use anchor_lang::prelude::*;

use crate::errors::PredictionMarketError;
use crate::state::{MarketType, MarketStatus, PredictionMarket};

pub fn create_market(
    ctx: Context<CreateMarket>,
    market_id: [u8; 32],
    market_type: MarketType,
    closes_at: i64,
    oracle_feed: Pubkey,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let clock = Clock::get()?;

    require!(
        closes_at > clock.unix_timestamp,
        PredictionMarketError::InvalidMarketId
    );

    market.tournament = ctx.accounts.tournament.key();
    market.market_id = market_id;
    market.admin = ctx.accounts.admin.key();
    market.market_type = market_type;
    market.status = MarketStatus::Open;
    market.yes_pool = 0;
    market.no_pool = 0;
    market.yes_shares = 0;
    market.no_shares = 0;
    market.oracle_feed = oracle_feed;
    market.winning_outcome = None;
    market.created_at = clock.unix_timestamp;
    market.closes_at = closes_at;
    market.settled_at = None;
    market.bump = ctx.bumps.market;

    // Vault token account will be created implicitly on first deposit
    // No need to explicitly create it here

    msg!("Prediction market created: {:?}", market_type);
    msg!("Market closes at: {}", closes_at);
    msg!("Oracle feed: {}", oracle_feed);

    Ok(())
}

#[derive(Accounts)]
#[instruction(market_id: [u8; 32])]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = admin,
        space = PredictionMarket::LEN,
        seeds = [b"prediction-market", tournament.key().as_ref(), &market_id],
        bump
    )]
    pub market: Account<'info, PredictionMarket>,

    /// CHECK: Tournament account reference (validated in handler)
    pub tournament: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}
