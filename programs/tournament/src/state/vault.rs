use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct VaultAuthority {
    /// Associated tournament
    pub tournament: Pubkey,

    /// PDA bump seed
    pub bump: u8,
}

impl VaultAuthority {
    /// Calculate space needed for VaultAuthority account
    pub const LEN: usize = 8 +  // discriminator
        32 + // tournament (Pubkey)
        1;   // bump (u8)
}
