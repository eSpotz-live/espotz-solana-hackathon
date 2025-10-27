use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Tournament {
    /// Unique tournament ID
    pub id: u32,

    /// Tournament operator/admin
    pub admin: Pubkey,

    /// Current tournament status
    pub status: TournamentStatus,

    /// Game type (Fortnite, PUBG Mobile, etc.)
    pub game_type: GameType,

    /// Entry fee in USDC (lamports)
    pub entry_fee: u64,

    /// Total prize pool in USDC
    pub prize_pool: u64,

    /// Maximum number of players
    pub max_players: u16,

    /// Current registered players
    pub current_players: u16,

    /// Tournament start time (Unix timestamp)
    pub start_time: i64,

    /// Tournament end time (Unix timestamp)
    pub end_time: i64,

    /// PDA bump seed
    pub bump: u8,
}

impl Tournament {
    /// Calculate space needed for Tournament account
    /// Discriminator (8) + all fields
    pub const LEN: usize = 8 + // discriminator
        4 +  // id (u32)
        32 + // admin (Pubkey)
        1 +  // status (enum u8)
        1 +  // game_type (enum u8)
        8 +  // entry_fee (u64)
        8 +  // prize_pool (u64)
        2 +  // max_players (u16)
        2 +  // current_players (u16)
        8 +  // start_time (i64)
        8 +  // end_time (i64)
        1;   // bump (u8)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum TournamentStatus {
    #[default]
    Registration,  // Accepting players
    Active,        // Tournament in progress
    Ended,         // Tournament completed, awaiting distribution
    Completed,     // Prizes distributed
    Cancelled,     // Tournament cancelled (refunds enabled)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum GameType {
    #[default]
    Fortnite,
    PubgMobile,
    CallOfDutyMobile,
    Valorant,
    Apex,
    Warzone,
    Other,
}
