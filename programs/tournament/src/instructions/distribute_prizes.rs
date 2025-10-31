use anchor_lang::prelude::*;

use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(winners: Vec<Pubkey>, amounts: Vec<u64>)]
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

        // Transfer lamports directly (vault is System Program owned)
        **ctx.accounts.vault_account.try_borrow_mut_lamports()? -= *amount;
        **winner_account.try_borrow_mut_lamports()? += *amount;
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
