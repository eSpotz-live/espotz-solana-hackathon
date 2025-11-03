use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

declare_id!("MD63kQkcMMZdw2fCBMNxH3WDj7n1nbb1x1irTMwEUBP");

#[program]
pub mod prediction_market {
    use super::*;

    /// Create a new prediction market for a tournament
    pub fn create_market(
        ctx: Context<CreateMarket>,
        market_id: [u8; 32],
        market_type: MarketType,
        closes_at: i64,
        oracle_feed: Pubkey,
    ) -> Result<()> {
        instructions::create_market::create_market(
            ctx,
            market_id,
            market_type,
            closes_at,
            oracle_feed,
        )
    }

    /// Initialize user position before placing first bet
    pub fn init_position(
        ctx: Context<InitPosition>,
        outcome: Outcome,
    ) -> Result<()> {
        instructions::init_position::init_position(ctx, outcome)
    }

    /// Place a bet on a market outcome
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        outcome: Outcome,
        amount: u64,
    ) -> Result<()> {
        instructions::place_bet::place_bet(ctx, outcome, amount)
    }

    /// Close market for betting (after closes_at time)
    pub fn close_market(ctx: Context<CloseMarket>) -> Result<()> {
        instructions::close_market::close_market(ctx)
    }

    /// Settle market with winning outcome (admin manual resolution for MVP)
    pub fn settle_market(
        ctx: Context<SettleMarket>,
        winning_outcome: Outcome,
    ) -> Result<()> {
        instructions::settle_market::settle_market(ctx, winning_outcome)
    }

    /// Claim winnings after market settlement
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings::claim_winnings(ctx)
    }
}
