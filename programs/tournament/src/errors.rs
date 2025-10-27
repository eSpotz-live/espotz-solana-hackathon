use anchor_lang::prelude::*;

#[error_code]
pub enum TournamentError {
    #[msg("Tournament has already started")]
    TournamentAlreadyStarted,

    #[msg("Tournament is full")]
    TournamentFull,

    #[msg("Registration period has ended")]
    RegistrationClosed,

    #[msg("Tournament has not started yet")]
    TournamentNotStarted,

    #[msg("Tournament has not ended yet")]
    TournamentNotEnded,

    #[msg("Tournament is not in the correct status for this operation")]
    InvalidTournamentStatus,

    #[msg("Unauthorized: Only admin can perform this action")]
    Unauthorized,

    #[msg("Invalid entry fee amount")]
    InvalidEntryFee,

    #[msg("Invalid tournament parameters")]
    InvalidParameters,

    #[msg("Start time must be before end time")]
    InvalidTimes,

    #[msg("Prize distribution exceeds prize pool")]
    InsufficientPrizePool,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Arithmetic underflow")]
    Underflow,

    #[msg("Winner list does not match amount list")]
    MismatchedArrays,

    #[msg("Tournament is not cancelled")]
    TournamentNotCancelled,

    #[msg("Player already refunded")]
    AlreadyRefunded,

    #[msg("Tournament cannot be cancelled after it has ended")]
    CannotCancelAfterEnd,

    #[msg("Invalid USDC mint address")]
    InvalidMint,

    #[msg("Player is not registered for this tournament")]
    PlayerNotRegistered,
}
