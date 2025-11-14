use anchor_lang::prelude::*;

/// Oracle feed account for tournament results verification
/// This account stores the Switchboard oracle feed pubkey for a tournament
#[account]
#[derive(Default)]
pub struct TournamentOracle {
    /// The tournament this oracle is associated with
    pub tournament: Pubkey,

    /// Switchboard pull feed pubkey
    pub oracle_feed: Pubkey,

    /// Oracle queue pubkey
    pub oracle_queue: Pubkey,

    /// Whether the oracle has been initialized
    pub is_initialized: bool,

    /// Last verified result timestamp
    pub last_verification_timestamp: i64,

    /// Winner verified by oracle (for single winner tournaments)
    /// For multi-winner, we'll use events and off-chain data
    pub verified_winner: Pubkey,

    /// PDA bump seed
    pub bump: u8,
}

impl TournamentOracle {
    /// Calculate space needed for TournamentOracle account
    pub const LEN: usize = 8 + // discriminator
        32 + // tournament (Pubkey)
        32 + // oracle_feed (Pubkey)
        32 + // oracle_queue (Pubkey)
        1 +  // is_initialized (bool)
        8 +  // last_verification_timestamp (i64)
        32 + // verified_winner (Pubkey)
        1;   // bump (u8)
}

/// Oracle verification result
/// This is the data structure that the oracle will publish
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OracleVerificationData {
    /// Tournament ID
    pub tournament_id: u32,

    /// Winning team/player pubkey
    pub winner: Pubkey,

    /// Timestamp of result
    pub timestamp: i64,

    /// Score or points (optional, for future use)
    pub score: u64,
}
