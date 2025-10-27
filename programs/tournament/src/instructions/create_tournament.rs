use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(id: u32)]
pub struct CreateTournament<'info> {
    #[account(
        init,
        payer = admin,
        space = Tournament::LEN,
        seeds = [b"tournament", id.to_le_bytes().as_ref()],
        bump
    )]
    pub tournament: Account<'info, Tournament>,

    #[account(
        init,
        payer = admin,
        space = VaultAuthority::LEN,
        seeds = [b"vault-authority", tournament.key().as_ref()],
        bump
    )]
    pub vault_authority: Account<'info, VaultAuthority>,

    /// Vault token account to hold USDC
    #[account(
        init,
        payer = admin,
        token::mint = usdc_mint,
        token::authority = vault_authority,
        seeds = [b"vault-token", tournament.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// USDC mint (devnet or mainnet)
    pub usdc_mint: Account<'info, Mint>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CreateTournament>,
    id: u32,
    game_type: GameType,
    entry_fee: u64,
    max_players: u16,
    start_time: i64,
    end_time: i64,
) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;
    let vault_authority = &mut ctx.accounts.vault_authority;
    let clock = Clock::get()?;

    // Validations
    require!(start_time > clock.unix_timestamp, TournamentError::InvalidTimes);
    require!(start_time < end_time, TournamentError::InvalidTimes);
    require!(max_players > 0, TournamentError::InvalidParameters);
    require!(entry_fee > 0, TournamentError::InvalidEntryFee);

    // Initialize tournament
    tournament.id = id;
    tournament.admin = ctx.accounts.admin.key();
    tournament.status = TournamentStatus::Registration;
    tournament.game_type = game_type;
    tournament.entry_fee = entry_fee;
    tournament.prize_pool = 0;
    tournament.max_players = max_players;
    tournament.current_players = 0;
    tournament.start_time = start_time;
    tournament.end_time = end_time;
    tournament.bump = ctx.bumps.tournament;

    // Initialize vault authority
    vault_authority.tournament = tournament.key();
    vault_authority.bump = ctx.bumps.vault_authority;

    emit!(TournamentCreated {
        tournament: tournament.key(),
        admin: tournament.admin,
        id,
        game_type,
        entry_fee,
        max_players,
        start_time,
        end_time,
    });

    Ok(())
}

#[event]
pub struct TournamentCreated {
    pub tournament: Pubkey,
    pub admin: Pubkey,
    pub id: u32,
    pub game_type: GameType,
    pub entry_fee: u64,
    pub max_players: u16,
    pub start_time: i64,
    pub end_time: i64,
}
