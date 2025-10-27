use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct DistributePrizes<'info> {
    #[account(
        mut,
        constraint = tournament.admin == admin.key() @ TournamentError::Unauthorized,
        constraint = tournament.status == TournamentStatus::Ended @ TournamentError::InvalidTournamentStatus,
    )]
    pub tournament: Account<'info, Tournament>,

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

    pub admin: Signer<'info>,
    pub token_program: Program<'info, Token>,
    // Winner token accounts passed as remaining_accounts
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, DistributePrizes<'info>>,
    winners: Vec<Pubkey>,
    amounts: Vec<u64>,
) -> Result<()> {
    let tournament = &mut ctx.accounts.tournament;

    // Validate arrays match
    require!(
        winners.len() == amounts.len(),
        TournamentError::MismatchedArrays
    );

    // Validate total doesn't exceed prize pool
    let total_distribution: u64 = amounts.iter().sum();
    require!(
        total_distribution <= tournament.prize_pool,
        TournamentError::InsufficientPrizePool
    );

    // Prepare PDA signer seeds
    let tournament_key = tournament.key();
    let seeds = &[
        b"vault-authority",
        tournament_key.as_ref(),
        &[ctx.accounts.vault_authority.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // Distribute prizes to each winner
    // Winners' token accounts should be passed as remaining_accounts
    for (i, (winner, amount)) in winners.iter().zip(amounts.iter()).enumerate() {
        if *amount == 0 {
            continue;
        }

        // Get winner's token account from remaining_accounts
        let winner_token_account = &ctx.remaining_accounts[i];

        // Verify it's the correct token account
        let winner_token_account_data = TokenAccount::try_deserialize(
            &mut &winner_token_account.data.borrow()[..]
        )?;

        require!(
            winner_token_account_data.owner == *winner,
            TournamentError::Unauthorized
        );

        require!(
            winner_token_account_data.mint == ctx.accounts.vault_token_account.mint,
            TournamentError::InvalidMint
        );

        // Transfer from vault to winner
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: winner_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, *amount)?;
    }

    // Update tournament status
    tournament.status = TournamentStatus::Completed;

    emit!(PrizesDistributed {
        tournament: tournament.key(),
        winners: winners.clone(),
        amounts: amounts.clone(),
        total: total_distribution,
    });

    Ok(())
}

#[event]
pub struct PrizesDistributed {
    pub tournament: Pubkey,
    pub winners: Vec<Pubkey>,
    pub amounts: Vec<u64>,
    pub total: u64,
}
