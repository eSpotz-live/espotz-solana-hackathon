use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::errors::PredictionMarketError;
use crate::state::{MarketStatus, Outcome, PredictionMarket, UserPosition};

pub fn place_bet(
    ctx: Context<PlaceBet>,
    outcome: Outcome,
    amount: u64,
) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let position = &mut ctx.accounts.position;
    let clock = Clock::get()?;

    // Validate market status
    require!(
        market.status == MarketStatus::Open,
        PredictionMarketError::MarketNotOpen
    );

    require!(
        clock.unix_timestamp < market.closes_at,
        PredictionMarketError::MarketNotOpen
    );

    require!(
        amount > 0,
        PredictionMarketError::InvalidBetAmount
    );

    // Calculate shares based on current pool prices
    let shares = market.calculate_shares(amount, outcome);

    // Transfer SOL from user to vault
    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault_token.to_account_info(),
            },
        ),
        amount,
    )?;

    // Update market pools and shares
    match outcome {
        Outcome::Yes => {
            market.yes_pool = market.yes_pool.checked_add(amount)
                .ok_or(PredictionMarketError::CalculationOverflow)?;
            market.yes_shares = market.yes_shares.checked_add(shares)
                .ok_or(PredictionMarketError::CalculationOverflow)?;
        }
        Outcome::No => {
            market.no_pool = market.no_pool.checked_add(amount)
                .ok_or(PredictionMarketError::CalculationOverflow)?;
            market.no_shares = market.no_shares.checked_add(shares)
                .ok_or(PredictionMarketError::CalculationOverflow)?;
        }
    }

    // Update user position
    position.amount = position.amount.checked_add(amount)
        .ok_or(PredictionMarketError::CalculationOverflow)?;
    position.shares = position.shares.checked_add(shares)
        .ok_or(PredictionMarketError::CalculationOverflow)?;

    msg!("Bet placed: {:?} for {} lamports", outcome, amount);
    msg!("Shares received: {}", shares);
    msg!("New YES price: {:.4}", market.yes_price());
    msg!("New NO price: {:.4}", market.no_price());

    Ok(())
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub market: Account<'info, PredictionMarket>,

    #[account(mut)]
    pub position: Account<'info, UserPosition>,

    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Vault token account (no bump validation - System owned)
    #[account(mut)]
    pub vault_token: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
