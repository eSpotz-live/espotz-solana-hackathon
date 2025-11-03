use anchor_lang::prelude::*;

#[error_code]
pub enum PredictionMarketError {
    #[msg("Market is not open for betting")]
    MarketNotOpen,

    #[msg("Market is not closed yet")]
    MarketNotClosed,

    #[msg("Market is already settled")]
    MarketAlreadySettled,

    #[msg("Market is not settled yet")]
    MarketNotSettled,

    #[msg("Invalid bet amount (must be > 0)")]
    InvalidBetAmount,

    #[msg("User has already claimed their payout")]
    AlreadyClaimed,

    #[msg("User has no winnings to claim")]
    NoWinnings,

    #[msg("Oracle data is stale")]
    StaleOracleData,

    #[msg("Invalid oracle response")]
    InvalidOracleResponse,

    #[msg("Insufficient liquidity in pool")]
    InsufficientLiquidity,

    #[msg("Market has not started yet")]
    MarketNotStarted,

    #[msg("Unauthorized admin access")]
    Unauthorized,

    #[msg("Invalid market ID")]
    InvalidMarketId,

    #[msg("Calculation overflow")]
    CalculationOverflow,
}
