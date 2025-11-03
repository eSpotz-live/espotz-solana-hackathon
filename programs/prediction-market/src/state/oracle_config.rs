use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct OracleConfig {
    /// Market this oracle config belongs to
    pub market: Pubkey,

    /// Switchboard oracle feed address
    pub feed_address: Pubkey,

    /// Guardian queue for oracle verification
    pub guardian_queue: Pubkey,

    /// Maximum age of oracle data (in seconds)
    pub max_staleness: i64,

    /// Minimum number of oracle responses required
    pub min_responses: u8,

    /// Last update timestamp
    pub last_update: i64,

    /// Bump seed for PDA
    pub bump: u8,
}

impl OracleConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // market
        32 + // feed_address
        32 + // guardian_queue
        8 +  // max_staleness
        1 +  // min_responses
        8 +  // last_update
        1;   // bump
}
