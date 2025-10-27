use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct PlayerEntry {
    /// Associated tournament
    pub tournament: Pubkey,

    /// Player wallet address
    pub player: Pubkey,

    /// Registration timestamp
    pub entry_time: i64,

    /// Whether player has been refunded
    pub refunded: bool,

    /// PDA bump seed
    pub bump: u8,
}

impl PlayerEntry {
    /// Calculate space needed for PlayerEntry account
    pub const LEN: usize = 8 +  // discriminator
        32 + // tournament (Pubkey)
        32 + // player (Pubkey)
        8 +  // entry_time (i64)
        1 +  // refunded (bool)
        1;   // bump (u8)
}
