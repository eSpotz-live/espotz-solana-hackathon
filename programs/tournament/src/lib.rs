use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;

use instructions::*;
use state::*;

declare_id!("BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv");

#[program]
pub mod tournament {
    use super::*;

    /// Create a new tournament
    pub fn create_tournament(
        ctx: Context<CreateTournament>,
        id: u32,
        game_type: GameType,
        entry_fee: u64,
        max_players: u16,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        instructions::create_tournament::handler(
            ctx,
            id,
            game_type,
            entry_fee,
            max_players,
            start_time,
            end_time,
        )
    }

    /// Register a player for a tournament
    pub fn register_player(ctx: Context<RegisterPlayer>) -> Result<()> {
        instructions::register_player::handler(ctx)
    }

    /// Submit tournament results (admin only)
    pub fn submit_results(
        ctx: Context<SubmitResults>,
        winners: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::submit_results::handler(ctx, winners)
    }

    /// Distribute prizes to winners (admin only)
    pub fn distribute_prizes<'info>(
        ctx: Context<'_, '_, '_, 'info, DistributePrizes<'info>>,
        winners: Vec<Pubkey>,
        amounts: Vec<u64>,
    ) -> Result<()> {
        instructions::distribute_prizes::handler(ctx, winners, amounts)
    }

    /// Cancel tournament (admin only)
    pub fn cancel_tournament(ctx: Context<CancelTournament>) -> Result<()> {
        instructions::cancel_tournament::handler(ctx)
    }

    /// Claim refund for cancelled tournament
    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        instructions::claim_refund::handler(ctx)
    }

    /// Start tournament (changes status from Registration to Active)
    pub fn start_tournament(ctx: Context<StartTournament>) -> Result<()> {
        let tournament = &mut ctx.accounts.tournament;
        let clock = Clock::get()?;

        // Validate timing
        require!(
            clock.unix_timestamp >= tournament.start_time,
            errors::TournamentError::TournamentNotStarted
        );

        // Update status
        tournament.status = TournamentStatus::Active;

        emit!(TournamentStarted {
            tournament: tournament.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Initialize Switchboard oracle for tournament
    pub fn initialize_oracle(ctx: Context<InitializeOracle>) -> Result<()> {
        instructions::initialize_oracle::handler(ctx)
    }

    /// Distribute prizes with Switchboard oracle verification
    pub fn distribute_prizes_oracle<'info>(
        ctx: Context<'_, '_, '_, 'info, DistributePrizesOracle<'info>>,
        winners: Vec<Pubkey>,
        amounts: Vec<u64>,
    ) -> Result<()> {
        instructions::distribute_prizes_oracle::handler(ctx, winners, amounts)
    }
}

#[derive(Accounts)]
pub struct StartTournament<'info> {
    #[account(
        mut,
        constraint = tournament.admin == admin.key() @ errors::TournamentError::Unauthorized,
        constraint = tournament.status == TournamentStatus::Registration @ errors::TournamentError::InvalidTournamentStatus,
    )]
    pub tournament: Account<'info, Tournament>,
    pub admin: Signer<'info>,
}

#[event]
pub struct TournamentStarted {
    pub tournament: Pubkey,
    pub timestamp: i64,
}
