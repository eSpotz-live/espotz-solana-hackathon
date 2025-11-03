use anchor_lang::prelude::*;
use super::Outcome;

#[account]
#[derive(Default)]
pub struct UserPosition {
    /// Market this position belongs to
    pub market: Pubkey,

    /// User who owns this position
    pub user: Pubkey,

    /// Which outcome the user bet on
    pub outcome: Outcome,

    /// Amount of SOL bet
    pub amount: u64,

    /// Number of shares owned
    pub shares: u64,

    /// Whether the user has claimed their payout
    pub claimed: bool,

    /// Timestamp when position was created
    pub created_at: i64,

    /// Bump seed for PDA
    pub bump: u8,
}

impl UserPosition {
    pub const LEN: usize = 8 + // discriminator
        32 + // market
        32 + // user
        1 +  // outcome
        8 +  // amount
        8 +  // shares
        1 +  // claimed
        8 +  // created_at
        1;   // bump
}
