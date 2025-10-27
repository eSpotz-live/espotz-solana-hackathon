use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct RegisterPlayer<'info> {
    #[account(
        mut,
        constraint = tournament.status == TournamentStatus::Registration @ TournamentError::InvalidTournamentStatus,
        constraint = tournament.current_players < tournament.max_players @ TournamentError::TournamentFull,
    )]
    pub tournament: Account<'info, Tournament>,

    #[account(
        init,
        payer = player,
        space = PlayerEntry::LEN,
        seeds = [
            b"player-entry",
            tournament.key().as_ref(),
            player.key().as_ref()
        ],
        bump
    )]
    pub player_entry: Account<'info, PlayerEntry>,

    /// Player's USDC token account
    #[account(
        mut,
        constraint = player_token_account.mint == vault_token_account.mint,
        constraint = player_token_account.owner == player.key(),
    )]
    pub player_token_account: Account<'info, TokenAccount>,

    /// Tournament vault token account
    #[account(
        mut,
        seeds = [b"vault-token", tournament.key().as_ref()],
        bump,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub player: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<RegisterPlayer>) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    let player_entry = &mut ctx.accounts.player_entry;
    let clock = Clock::get()?;

    // Validate timing
    require!(
        clock.unix_timestamp < tournament.start_time,
        TournamentError::TournamentAlreadyStarted
    );

    // Transfer entry fee from player to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.player_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.player.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, tournament.entry_fee)?;

    // Update tournament state
    tournament.prize_pool = tournament.prize_pool
        .checked_add(tournament.entry_fee)
        .ok_or(TournamentError::Overflow)?;

    tournament.current_players = tournament.current_players
        .checked_add(1)
        .ok_or(TournamentError::Overflow)?;

    // Initialize player entry
    player_entry.tournament = tournament.key();
    player_entry.player = ctx.accounts.player.key();
    player_entry.entry_time = clock.unix_timestamp;
    player_entry.refunded = false;
    player_entry.bump = ctx.bumps.player_entry;

    emit!(PlayerRegistered {
        tournament: tournament.key(),
        player: ctx.accounts.player.key(),
        entry_time: clock.unix_timestamp,
        current_players: tournament.current_players,
    });

    Ok(())
}

#[event]
pub struct PlayerRegistered {
    pub tournament: Pubkey,
    pub player: Pubkey,
    pub entry_time: i64,
    pub current_players: u16,
}
