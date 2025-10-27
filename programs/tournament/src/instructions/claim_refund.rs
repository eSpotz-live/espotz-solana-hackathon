use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, CloseAccount};

use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(
        constraint = tournament.status == TournamentStatus::Cancelled @ TournamentError::TournamentNotCancelled,
    )]
    pub tournament: Account<'info, Tournament>,

    #[account(
        mut,
        constraint = player_entry.tournament == tournament.key(),
        constraint = player_entry.player == player.key(),
        constraint = !player_entry.refunded @ TournamentError::AlreadyRefunded,
        seeds = [
            b"player-entry",
            tournament.key().as_ref(),
            player.key().as_ref()
        ],
        bump = player_entry.bump,
        close = player  // Reclaim rent to player
    )]
    pub player_entry: Account<'info, PlayerEntry>,

    #[account(
        seeds = [b"vault-authority", tournament.key().as_ref()],
        bump = vault_authority.bump,
    )]
    pub vault_authority: Account<'info, VaultAuthority>,

    /// Tournament vault token account
    #[account(
        mut,
        seeds = [b"vault-token", tournament.key().as_ref()],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// Player's USDC token account
    #[account(
        mut,
        constraint = player_token_account.mint == vault_token_account.mint,
        constraint = player_token_account.owner == player.key(),
    )]
    pub player_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ClaimRefund>) -> Result<()> {
    let tournament = &ctx.accounts.tournament;
    let clock = Clock::get()?;

    // Prepare PDA signer seeds
    let tournament_key = tournament.key();
    let seeds = &[
        b"vault-authority",
        tournament_key.as_ref(),
        &[ctx.accounts.vault_authority.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // Transfer entry fee back to player
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.player_token_account.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    token::transfer(cpi_ctx, tournament.entry_fee)?;

    emit!(RefundClaimed {
        tournament: tournament.key(),
        player: ctx.accounts.player.key(),
        amount: tournament.entry_fee,
        timestamp: clock.unix_timestamp,
    });

    // player_entry account is automatically closed and rent reclaimed

    Ok(())
}

#[event]
pub struct RefundClaimed {
    pub tournament: Pubkey,
    pub player: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
