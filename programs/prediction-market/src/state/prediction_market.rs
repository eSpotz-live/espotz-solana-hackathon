use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct PredictionMarket {
    /// Tournament this market is associated with
    pub tournament: Pubkey,

    /// Unique market ID (e.g., "first-kill", "mvp", "total-kills")
    pub market_id: [u8; 32],

    /// Market creator (admin)
    pub admin: Pubkey,

    /// Market type
    pub market_type: MarketType,

    /// Current status
    pub status: MarketStatus,

    /// YES liquidity pool (in lamports)
    pub yes_pool: u64,

    /// NO liquidity pool (in lamports)
    pub no_pool: u64,

    /// Total YES shares issued
    pub yes_shares: u64,

    /// Total NO shares issued
    pub no_shares: u64,

    /// Oracle feed address (Switchboard)
    pub oracle_feed: Pubkey,

    /// Winning outcome (set after settlement)
    pub winning_outcome: Option<Outcome>,

    /// Timestamp when market was created
    pub created_at: i64,

    /// Timestamp when market closes for betting
    pub closes_at: i64,

    /// Timestamp when market was settled
    pub settled_at: Option<i64>,

    /// Bump seed for PDA
    pub bump: u8,
}

impl PredictionMarket {
    pub const LEN: usize = 8 + // discriminator
        32 + // tournament
        32 + // market_id
        32 + // admin
        1 +  // market_type
        1 +  // status
        8 +  // yes_pool
        8 +  // no_pool
        8 +  // yes_shares
        8 +  // no_shares
        32 + // oracle_feed
        2 +  // winning_outcome (Option<Outcome>)
        8 +  // created_at
        8 +  // closes_at
        9 +  // settled_at (Option<i64>)
        1;   // bump

    /// Calculate YES price based on liquidity pools
    pub fn yes_price(&self) -> f64 {
        let total = self.yes_pool + self.no_pool;
        if total == 0 {
            return 0.5; // Default 50/50 for new markets
        }
        self.yes_pool as f64 / total as f64
    }

    /// Calculate NO price based on liquidity pools
    pub fn no_price(&self) -> f64 {
        1.0 - self.yes_price()
    }

    /// Calculate shares to receive for a bet amount
    pub fn calculate_shares(&self, amount: u64, outcome: Outcome) -> u64 {
        match outcome {
            Outcome::Yes => {
                // Shares = amount / yes_price
                let price = self.yes_price();
                if price == 0.0 {
                    return amount; // Edge case
                }
                (amount as f64 / price) as u64
            }
            Outcome::No => {
                let price = self.no_price();
                if price == 0.0 {
                    return amount;
                }
                (amount as f64 / price) as u64
            }
        }
    }

    /// Calculate payout for shares after settlement
    pub fn calculate_payout(&self, shares: u64, outcome: Outcome) -> Option<u64> {
        let winning_outcome = self.winning_outcome?;

        if outcome != winning_outcome {
            return Some(0); // Lost bet
        }

        let total_pool = self.yes_pool + self.no_pool;
        let winning_shares = match winning_outcome {
            Outcome::Yes => self.yes_shares,
            Outcome::No => self.no_shares,
        };

        if winning_shares == 0 {
            return Some(0);
        }

        // Payout = (shares / total_winning_shares) * total_pool
        Some((shares as u128 * total_pool as u128 / winning_shares as u128) as u64)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum MarketType {
    FirstKill,
    MVP,
    TotalKills,
    RoundWinner,
    MatchWinner,
}

impl Default for MarketType {
    fn default() -> Self {
        MarketType::FirstKill
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum MarketStatus {
    Open,      // Accepting bets
    Closed,    // No more bets, waiting for oracle
    Settled,   // Oracle resolved, payouts available
    Cancelled, // Market cancelled, refunds available
}

impl Default for MarketStatus {
    fn default() -> Self {
        MarketStatus::Open
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum Outcome {
    Yes,
    No,
}

impl Default for Outcome {
    fn default() -> Self {
        Outcome::Yes
    }
}
