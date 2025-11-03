use anchor_lang::prelude::*;

use crate::errors::PredictionMarketError;
use crate::state::{MarketStatus, PredictionMarket, UserPosition};

pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
    let market = &ctx.accounts.market;
    let position = &mut ctx.accounts.position;

    // Validate market is settled
    require!(
        market.status == MarketStatus::Settled,
        PredictionMarketError::MarketNotSettled
    );

    // Validate user hasn't claimed yet
    require!(
        !position.claimed,
        PredictionMarketError::AlreadyClaimed
    );

    // Calculate payout
    let payout = market
        .calculate_payout(position.shares, position.outcome)
        .ok_or(PredictionMarketError::CalculationOverflow)?;

    require!(
        payout > 0,
        PredictionMarketError::NoWinnings
    );

    // Transfer winnings from vault to user using direct lamport manipulation
    **ctx.accounts.vault_token.try_borrow_mut_lamports()? = ctx
        .accounts
        .vault_token
        .lamports()
        .checked_sub(payout)
        .ok_or(PredictionMarketError::InsufficientLiquidity)?;

    **ctx.accounts.user.try_borrow_mut_lamports()? = ctx
        .accounts
        .user
        .lamports()
        .checked_add(payout)
        .ok_or(PredictionMarketError::CalculationOverflow)?;

    // Mark position as claimed
    position.claimed = true;

    msg!("Winnings claimed: {} lamports", payout);
    msg!("Shares: {}", position.shares);
    msg!("Outcome: {:?}", position.outcome);

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    pub market: Account<'info, PredictionMarket>,

    #[account(
        mut,
        has_one = market,
        has_one = user
    )]
    pub position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Vault token account (System owned - no bump validation)
    #[account(mut)]
    pub vault_token: UncheckedAccount<'info>,

    /// CHECK: Vault authority PDA (not used but kept for future)
    pub vault_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
