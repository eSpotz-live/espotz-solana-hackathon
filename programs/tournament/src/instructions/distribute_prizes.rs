use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

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

    /// CHECK: Tournament vault account (PDA, seeds validated)
    #[account(
        mut,
        seeds = [b"vault-token", tournament.key().as_ref()],
        bump,
    )]
    pub vault_account: AccountInfo<'info>,

    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
    // Winner accounts passed as remaining_accounts
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
    // Winners should be passed as remaining_accounts
    for (i, (winner, amount)) in winners.iter().zip(amounts.iter()).enumerate() {
        if *amount == 0 {
            continue;
        }

        // Get winner account from remaining_accounts
        let winner_account = &ctx.remaining_accounts[i];

        // Verify the account matches the winner pubkey
        require!(
            winner_account.key() == *winner,
            TournamentError::Unauthorized
        );

        // Transfer from vault to winner
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_account.to_account_info(),
            to: winner_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(cpi_ctx, *amount)?;
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
