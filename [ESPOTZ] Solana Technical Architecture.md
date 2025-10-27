# Espotz
## Solana Technical Architecture Document

---

## Table of Contents

1. [Introduction](#introduction)
2. [High-Level Overview](#high-level-overview)
3. [Definitions, Acronyms and Abbreviations](#definitions-acronyms-and-abbreviations)
4. [Deliverables](#deliverables)
5. [Architecture Constraints](#architecture-constraints)
6. [Architecture Overview](#architecture-overview)
7. [Smart Contract Overview](#smart-contract-overview)
8. [Technology Stack](#technology-stack)
9. [Integrations](#integrations)

---

## Introduction

### High-Level Overview

**Espotz** is a decentralized esports tournament platform built on the Solana blockchain. The platform enables tournament operators to create and manage esports competitions, teams/players to register and compete for prizes, and handle all financial transactions through programmable smart contracts.

Unlike the Aptos version which relied on AI-powered stream analysis and oracles, this Solana implementation focuses on **tournament operator-controlled result submission** without oracle dependencies. A later version will have a custom oracle integration. The system combines smart contract automation with manual (but verifiable) result reporting from tournament operators, ensuring transparency while maintaining operational simplicity.

Smart contracts handle all financial transactions including entry fees in USDC, prize escrow, and prize distribution to winners. The architecture leverages Solana's high throughput and low costs to provide a seamless tournament experience.

---

## Definitions, Acronyms and Abbreviations

- **Tournament Operator (TO)**: Individual or organization that creates, manages, and validates tournament results
- **Player/Team**: Users participating in tournaments and competing for prizes
- **Solana Program**: Smart contract deployed on the Solana blockchain (equivalent to Move module on Aptos)
- **Rust**: Primary language for Solana smart contract development
- **Anchor Framework**: Development framework for Solana programs that dramatically simplifies development
- **PDA (Program Derived Address)**: Deterministic address derived from a program and seeds with no associated private key; used for account storage and program signing
- **CPI (Cross-Program Invocation)**: Mechanism for one Solana program to call another program's instructions
- **SPL Token**: Solana Program Library token standard (equivalent to Move token on Aptos)
- **USDC**: USD Coin stablecoin on Solana for entry fees and prize distribution
- **RPC**: Remote Procedure Call provider for blockchain communication
- **IDL**: Interface Definition Language; automatically generated description of program instructions
- **dApp**: Decentralized application (frontend + smart contract)
- **Mainnet Beta**: Solana production environment with real SOL and token costs
- **Devnet**: Solana public test environment with free test SOL via airdrop
- **Localnet**: Solana local development environment

---

## Deliverables

### Deliverable 1: Tournament Management System

**Core tournament creation and management functionality**

**Features:**
- Tournament creation interface for operators
- Customizable tournament parameters (game type, entry fee in USDC, max players, start/end times)
- Team or Player identifications (by wallet addresses)
- Team/Player registration with automatic entry fee collection
- Prize pool management and escrow
- Tournament status tracking (Registration → Active → Ended → Completed)
- Prize distribution to winners

**User Stories:**
- As a tournament operator, I want to create a new tournament with custom parameters (game, entry fee, max players, schedule)
- As a tournament operator, I want to mark the tournament active and then completed once results are determined
- As a team/player, I want to register for tournaments by paying an entry fee in USDC through my Solana wallet
- As a participant, I want to view tournament details and know my registration status
- As a winner, I want to claim my prize distribution directly to my wallet after tournament completion

**Smart Contract Functionality:**
- Tournament creation with configurable parameters
- USDC entry fee collection into program-controlled escrow vault
- Player/team registration management
- Prize pool calculation and management
- Manual result submission by tournament operator
- Prize distribution based on operator-specified winners

### Deliverable 2: Transparent Result Management

**Operator-controlled result submission with transparency**

**Features:**
- Tournament operator result submission interface
- Result verification and validation
- On-chain event emission for transparency
- Historical result tracking and audit trail
- No oracle dependency

**User Stories:**
- As a tournament operator, I want to submit verified results directly to the smart contract after tournament completion
- As a player/team, I want to see all submitted results publicly on the blockchain with timestamps
- As a user, I want confidence that results are finalized and cannot be changed after submission

**Smart Contract Functionality:**
- Result submission by authorized tournament operator only
- Immutable result recording with timestamps
- Event emission for all result submissions
- Authorization controls ensuring only verified operators can submit

### Deliverable 3: Secure Prize Distribution

**Automated and transparent prize payout system**

**Features:**
- Prize distribution mechanism controlled by tournament operator
- Support for multiple winners with flexible prize splits
- Automatic USDC transfers to winner wallets
- Transaction finality guarantees
- Refund mechanism if tournament is cancelled

**User Stories:**
- As a tournament operator, I want to distribute prizes to multiple winners in a single or batch transaction
- As a winner, I want to receive my prize automatically to my USDC token account
- As a tournament operator, I want to cancel a tournament and trigger refunds to all registered players if needed

**Smart Contract Functionality:**
- Prize distribution with PDA-signed USDC transfers
- Support for batch operations with remaining accounts pattern
- Cancellation and refund functionality
- Event emission for all prize distributions

---

## Architecture Constraints

### Regulatory Constraints

- Compliance with gambling regulations in applicable jurisdictions
- Consideration of KYC/AML requirements depending on jurisdiction
- Age verification implementation if required (18+ players)
- Clear terms of service for tournament participation

### Technical Constraints

**Blockchain Limitations:**
- Solana transaction size limit: 1232 bytes
- Compute units per instruction: default 200K, max 1.4M per transaction
- Account data size limits for state storage
- Account rent requirements (must maintain minimum balance)

**Program Architecture:**
- Maximum CPI depth: 4 levels
- Account count per instruction: must specify all accounts upfront for parallelization
- Storage model: accounts are separate from program code
- Immutability: program code upgradeable (if authority retained), account state mutable

**State Management:**
- Each account has 8-byte discriminator for type identification
- Accounts must be rent-exempt (maintain minimum SOL balance)
- Account closure to reclaim rent costs lamports (SOL)

**Token Integration:**
- USDC mint address fixed (cannot change mid-operation)
- Token accounts must be initialized before receiving tokens
- Associated Token Account (ATA) pattern for user token accounts

### Operational Constraints

- No real-time oracle for automatic result determination
- Tournament operator must submit results manually (trusted entity)
- Single point of trust: tournament operator for result accuracy
- Mitigation: on-chain event history provides transparency and audit trail

---

## Architecture Overview

### C4 L1 Diagram: High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Espotz Platform                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Tournament Operators                                             │
│  ├─ Create tournaments                                           │
│  ├─ Submit results                                               │
│  └─ Distribute prizes                                            │
│                                                                   │
│              ↕                                                    │
│                                                                   │
│  Frontend Web Application (React + TypeScript)                  │
│  ├─ Wallet connection (Phantom, Solflare, etc.)                │
│  ├─ Tournament creation UI                                       │
│  ├─ Player registration UI                                       │
│  ├─ Result submission UI                                         │
│  └─ Prize claim UI                                               │
│                                                                   │
│              ↕                                                    │
│                                                                   │
│  Solana Smart Contracts (Anchor + Rust)                         │
│  ├─ Tournament Program (main contract)                          │
│  └─ Manages: registration, escrow, results, prizes              │
│                                                                   │
│              ↕                                                    │
│                                                                   │
│  Solana Blockchain (Devnet/Mainnet-Beta)                       │
│  ├─ Program accounts (code)                                     │
│  ├─ Data accounts (tournament state, player records)           │
│  ├─ Token vaults (USDC escrow)                                 │
│  └─ Transaction ledger                                          │
│                                                                   │
│              ↕                                                    │
│                                                                   │
│  Players/Teams                                                    │
│  ├─ Register for tournaments                                     │
│  ├─ Pay entry fees in USDC                                      │
│  └─ Claim winnings                                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### C4 L2 Diagram: System Components

```
┌────────────────────────────────────────────────────────────────────┐
│                      Espotz DApp System                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │         Frontend Web Application                            │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ - React.js with TypeScript                                 │ │
│  │ - Tournament creation & management UI                      │ │
│  │ - Player registration interface                            │ │
│  │ - Result submission dashboard                              │ │
│  │ - Prize claim functionality                                │ │
│  │ - Wallet connection (Phantom, Solflare)                   │ │
│  │ - Real-time state updates via RPC polling                │ │
│  │ - Components: Zustand for state, TailwindCSS for styling │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │      Solana Blockchain Interaction Layer                    │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ - Solana Web3.js / Umi Framework                           │ │
│  │ - Codama-generated TypeScript client                       │ │
│  │ - Wallet Adapter (Solana Wallet Adapter)                  │ │
│  │ - RPC Provider (Helius, QuickNode, Alchemy)              │ │
│  │ - Transaction building & signing                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │       Smart Contract Layer (On-Chain)                       │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │                                                              │ │
│  │  Tournament Program (Anchor + Rust)                        │ │
│  │  ├─ Account Structures:                                    │ │
│  │  │  ├─ Tournament (main tournament state)                 │ │
│  │  │  ├─ PlayerEntry (individual player registration)      │ │
│  │  │  ├─ PrizeVault (USDC escrow account)                 │ │
│  │  │  └─ VaultAuthority (PDA for vault control)           │ │
│  │  │                                                         │ │
│  │  └─ Instructions:                                         │ │
│  │     ├─ create_tournament                                 │ │
│  │     ├─ register_player                                   │ │
│  │     ├─ submit_results                                    │ │
│  │     ├─ distribute_prizes                                 │ │
│  │     ├─ cancel_tournament                                 │ │
│  │     └─ claim_refund                                      │ │
│  │                                                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │       Token & Program Integration Layer                      │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ - SPL Token Program (standard Solana token interface)       │ │
│  │ - USDC Token Mint (mainnet/devnet)                         │ │
│  │ - Associated Token Accounts (user USDC holdings)           │ │
│  │ - CPI: Cross-program invocations for token transfers       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │         Backend Services (Optional)                          │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ - Indexing service (Helius API or custom indexer)          │ │
│  │ - Event listener service                                    │ │
│  │ - Transaction status monitoring                             │ │
│  │ - Backend database for off-chain data (tournaments, etc.)  │ │
│  │ - REST API for frontend (optional layer)                   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │         Infrastructure Layer                                │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ - RPC Nodes (Helius, QuickNode, Alchemy, Triton)           │ │
│  │ - Solana Mainnet-Beta (production)                         │ │
│  │ - Solana Devnet (testing/staging)                          │ │
│  │ - Local validator (development)                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

### Smart Contract Architecture

```
Tournament Program Structure:
│
├─ Instructions (Handlers)
│  ├─ create_tournament()
│  │  └─ Initializes tournament account + vault
│  │     Entry: Operator signs transaction
│  │     Output: Tournament PDA created
│  │
│  ├─ register_player()
│  │  └─ Collects entry fee, records player
│  │     Entry: Player pays USDC
│  │     Output: PlayerEntry PDA created, fee transferred to vault
│  │
│  ├─ submit_results()
│  │  └─ Records tournament results
│  │     Entry: Operator submits winner list
│  │     Output: Tournament status → "Ended"
│  │
│  ├─ distribute_prizes()
│  │  └─ Pays USDC to winners
│  │     Entry: Prize distribution list
│  │     Output: USDC transferred from vault to winners
│  │
│  ├─ cancel_tournament()
│  │  └─ Marks tournament as cancelled
│  │     Entry: Operator cancels
│  │     Output: Tournament status → "Cancelled"
│  │
│  └─ claim_refund()
│     └─ Returns entry fee if cancelled
│        Entry: Player claims refund
│        Output: USDC returned from vault
│
├─ Accounts (State Storage)
│  ├─ Tournament (tournament metadata & state)
│  ├─ PlayerEntry (per-player registration record)
│  ├─ PrizeVault (USDC escrow holding account)
│  └─ VaultAuthority (PDA that controls vault)
│
├─ PDAs (Deterministic Addresses)
│  ├─ Tournament: ["tournament", tournament_id]
│  ├─ PlayerEntry: ["player-entry", tournament_key, player_key]
│  ├─ PrizeVault: ["prize-vault", tournament_key]
│  └─ VaultAuthority: ["vault-authority", tournament_key]
│
└─ Events (On-chain logging)
   ├─ TournamentCreated
   ├─ PlayerRegistered
   ├─ ResultsSubmitted
   ├─ PrizesDistributed
   ├─ TournamentCancelled
   └─ RefundClaimed
```

---

## Smart Contract Overview

### Tournament Program

**Purpose:** Manages tournament lifecycle, player registration, result submission, and prize distribution

**Architecture Pattern:** Account-based model with PDAs for deterministic state

**Key Accounts:**

```rust
// Main tournament state account
#[account]
pub struct Tournament {
    pub id: u32,                      // Tournament ID
    pub admin: Pubkey,                // Operator/admin wallet
    pub status: TournamentStatus,     // Registration/Active/Ended/Cancelled
    pub game_type: GameType,          // Fortnite, PUBG Mobile, etc.
    pub entry_fee: u64,               // Fee in USDC (lamports)
    pub prize_pool: u64,              // Total USDC in escrow
    pub max_players: u16,             // Tournament capacity
    pub current_players: u16,         // Registered players
    pub start_time: i64,              // Unix timestamp
    pub end_time: i64,                // Unix timestamp
    pub bump: u8,                     // PDA bump seed
}

// Player registration entry
#[account]
pub struct PlayerEntry {
    pub tournament: Pubkey,           // Tournament account key
    pub player: Pubkey,               // Player wallet
    pub entry_time: i64,              // Registration timestamp
    pub refunded: bool,               // Refund status
    pub bump: u8,                     // PDA bump seed
}

// Prize vault (holds USDC escrow)
#[account]
pub struct PrizeVault {
    pub tournament: Pubkey,           // Associated tournament
    pub token_account: Pubkey,        // USDC token account address
    pub total_deposited: u64,         // Track USDC in vault
    pub bump: u8,                     // PDA bump seed
}

// Vault authority (PDA that signs vault transactions)
#[account]
pub struct VaultAuthority {
    pub tournament: Pubkey,
    pub bump: u8,
}
```

**PDA Design:**

```rust
// Deterministic address generation ensures:
// - Same seeds always produce same address
// - Predictable account locations
// - No private key needed for program signing

// Tournament PDA
seeds = [b"tournament", tournament_id.to_le_bytes().as_ref()]
bump = canonical_bump

// Player entry PDA
seeds = [
    b"player-entry",
    tournament.key().as_ref(),
    player.key().as_ref()
]

// Prize vault PDA
seeds = [b"prize-vault", tournament.key().as_ref()]

// Vault authority PDA (signs token transfers)
seeds = [b"vault-authority", tournament.key().as_ref()]
```

**Key Instructions:**

#### 1. Create Tournament

```
Instruction: create_tournament(
    id: u32,
    game_type: GameType,
    entry_fee: u64,
    max_players: u16,
    start_time: i64,
    end_time: i64
)

Accounts Required:
- admin (signer) - Tournament creator
- tournament (pda, init) - New tournament account
- prize_vault (pda, init) - Prize vault account
- vault_authority (pda) - Vault controller
- system_program - For account creation
- token_program - For vault setup
- usdc_mint - USDC token mint address

Process:
1. Validate parameters (times, amounts, capacity)
2. Create tournament account with PDA
3. Initialize prize vault for USDC escrow
4. Set tournament status to "Registration"
5. Emit TournamentCreated event

Security:
- Only admin can create
- Time validations (start < end)
- Entry fee validation
```

#### 2. Register Player

```
Instruction: register_player()

Accounts Required:
- tournament (mut) - Tournament account
- tournament_vault (mut) - Prize vault account
- player (signer) - Player wallet
- player_token_account (mut) - Player's USDC account
- vault_token_account (mut) - Vault's USDC account
- player_entry (pda, init) - New player entry
- token_program - For USDC transfer
- system_program - For account creation

Process:
1. Validate tournament in registration phase
2. Validate tournament not full
3. Validate start time not passed
4. Transfer USDC from player to vault (CPI)
5. Create player entry account
6. Update tournament player count
7. Update prize pool
8. Emit PlayerRegistered event

Security:
- Signer requirement prevents unauthorized registration
- Account validation ensures correct vault
- Prevents duplicate registration (PDA uniqueness)
- Checks tournament state before accepting entries
```

#### 3. Submit Results

```
Instruction: submit_results(winners: Vec<Pubkey>)

Accounts Required:
- tournament (mut) - Tournament account
- admin (signer) - Tournament operator
- system_program

Process:
1. Validate caller is tournament admin
2. Validate tournament in "Active" state
3. Validate winner list
4. Update tournament status to "Ended"
5. Store winner information
6. Emit ResultsSubmitted event

Security:
- Only operator can submit results
- State machine prevents premature result submission
- Winners must be registered players
```

#### 4. Distribute Prizes

```
Instruction: distribute_prizes(
    winners: Vec<Pubkey>,
    prize_amounts: Vec<u64>
)

Accounts Required:
- tournament (mut) - Tournament account
- admin (signer) - Tournament operator
- vault_authority (pda) - Vault controller
- vault_token_account (mut) - Vault USDC source
- [Remaining accounts] - Winner USDC accounts
- token_program - For USDC transfer

Process:
1. Validate caller is operator
2. Validate tournament status is "Ended"
3. Validate prize amounts don't exceed pool
4. For each winner:
   - Transfer USDC from vault to winner
   - Vault signs via PDA (invoke_signed)
5. Update vault balance
6. Emit PrizesDistributed event

Security:
- Operator authorization required
- State machine prevents premature distribution
- Escrow safety: only PDA can release funds
- No private key can authorize vault withdrawals
```

#### 5. Cancel Tournament

```
Instruction: cancel_tournament()

Accounts Required:
- tournament (mut) - Tournament account
- admin (signer) - Tournament operator

Process:
1. Validate caller is operator
2. Validate tournament not already ended
3. Update status to "Cancelled"
4. Emit TournamentCancelled event
5. Enable refund mechanism

Security:
- Only operator can cancel
- Cannot cancel after tournament ends
```

#### 6. Claim Refund

```
Instruction: claim_refund()

Accounts Required:
- tournament (mut) - Tournament account
- player_entry (mut) - Player's entry account
- player (signer) - Player wallet
- vault_authority (pda) - Vault controller
- vault_token_account (mut) - Vault USDC source
- player_token_account (mut) - Player USDC destination
- token_program - For USDC transfer

Process:
1. Validate tournament is "Cancelled"
2. Validate player is registered
3. Validate not already refunded
4. Transfer entry fee from vault to player
5. Mark entry as refunded
6. Close player entry account (reclaim rent)
7. Emit RefundClaimed event

Security:
- Only works if tournament cancelled
- Prevents double refunds
- Escrow safety via PDA signing
```

**Integration Points:**

1. **SPL Token Program (CPI):**
   - Transfer USDC from players to vault
   - Transfer USDC from vault to winners
   - Used via Anchor's `token` module

2. **System Program (CPI):**
   - Account creation/initialization
   - Rent management

---

## Technology Stack

### Backend (Smart Contracts)

**Language & Framework:**
- **Rust** - Safe, performant systems language
- **Anchor Framework** - Production-ready smart contract development
  - Provides macro-based code generation
  - Automatic account validation
  - Built-in security checks
  - TypeScript client generation via IDL

**Version Recommendations:**
- Rust 1.75+ (latest stable)
- Anchor 0.30+
- Solana CLI stable

**Key Libraries:**
- `anchor-lang` - Core framework
- `anchor-spl` - SPL Token integration
- `solana-program` - Low-level Solana APIs
- `spl-token` - Token program interface

### Frontend

**Framework & Language:**
- **React 18+** - UI component library
- **TypeScript** - Type-safe JavaScript
- **Next.js** (optional) - Server-side rendering, API routes

**Blockchain Interaction:**
- **Solana Web3.js v2.0 or Umi Framework**
  - Modern modular client library
  - Better TypeScript support
  - Plugin architecture
- **Codama** - Generate TypeScript clients from Anchor IDL
- **@solana/wallet-adapter** - Wallet connection abstraction
  - Supports: Phantom, Solflare, Ledger, Backpack, etc.

**State Management:**
- **Zustand** or **Redux** - Client state
- **TanStack Query** - Server state & caching

**UI Components & Styling:**
- **TailwindCSS** - Utility-first CSS framework
- **Shadcn/ui** or **Radix UI** - Accessible component library
- **Chart.js** or **Recharts** - Tournament visualization

**Development Tools:**
- **Vite** - Fast build tool
- **Vitest** - Unit testing
- **Playwright** - E2E testing

### Infrastructure & Deployment

**RPC Providers (select one or use multiple):**
1. **Helius** (recommended for tournaments)
   - Enhanced APIs for token/NFT data
   - Webhooks for event listening
   - DAS API for complex queries
   - 99.99% uptime SLA
   - $0-50/month pricing

2. **QuickNode**
   - Global node network
   - High reliability
   - Good for production
   - Enhanced RPC methods

3. **Alchemy**
   - Comprehensive analytics
   - Good developer experience
   - Free tier available

4. **Triton** (Mercury)
   - Load balancing across RPC nodes
   - Failover protection

**Blockchain Networks:**
- **Solana Devnet** - Testing & staging (airdrop 2-5 SOL free)
- **Solana Mainnet-Beta** - Production (real USDC & SOL)

**Development Environment:**
- **Local Solana Validator** (`solana-test-validator`)
  - Single-node local cluster
  - Reset state easily
  - Instant transactions
  - No costs

**Backend Services (Optional):**
- **Node.js + Express** - Optional REST API layer
- **PostgreSQL** - Off-chain data storage (tournaments, schedules, etc.)
- **Redis** - Caching layer
- **Indexing Service:**
  - **Helius APIs** - Recommended (pre-indexed)
  - **Custom Indexer** - Listen to program events
  - **The Graph** - Decentralized indexing (if supported)

**Hosting & Deployment:**
- **Frontend:** Vercel, Netlify, Cloudflare Pages (serverless)
- **Backend API:** AWS EC2, Railway, Fly.io, Heroku (if needed)
- **Database:** PostgreSQL on AWS RDS, Supabase, Railway
- **Monitoring:** Sentry (error tracking), Datadog (APM)

### Testing & Development

**Smart Contract Testing:**
- **Anchor Test Framework** - Built-in TypeScript testing
- **Bankrun** - Faster local simulation
- **Surfpool** - Mainnet forking for realistic testing
- **Pinocchio** - CI/CD testing

**Smart Contract Quality:**
- **Anchor Security Checks** - Built-in validations
- **Manual Code Review** - Critical for production
- **Professional Audit** - Recommended before mainnet launch

**Frontend Testing:**
- **Vitest** - Unit tests
- **Playwright** - Integration/E2E tests
- **Jest** - Alternative unit testing

---

## Integrations

### Blockchain Integrations

**1. Solana Blockchain**
- **Purpose:** Execute all smart contracts and store tournament state
- **Integration Points:**
  - Program deployment (via Anchor CLI)
  - Account initialization and state updates
  - Transaction confirmation and finality
  - Event emission and listening
- **Key Considerations:**
  - Devnet for testing (free SOL via airdrop)
  - Mainnet for production (real SOL + USDC costs)
  - Transaction fees ~0.00025 SOL (~$0.03 at current prices)

**2. SPL Token Program**
- **Purpose:** Handle USDC transfers (entry fees, prizes)
- **Token Addresses:**
  - **Mainnet USDC:** `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
  - **Devnet USDC:** `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- **Integration Method:** CPI (Cross-Program Invocation)
  - Call SPL Token program from tournament program
  - Transfer USDC between accounts
  - Ensure correct mint validation
- **Associated Token Accounts:**
  - Each player needs USDC token account
  - Program creates/initializes as needed
  - Standard for all Solana token operations

**3. Wallet Integration**
- **Supported Wallets:**
  - Phantom (most popular, 15M+ users)
  - Solflare
  - Ledger Nano X/S
  - Backpack
  - Trust Wallet
  - Magic Eden wallet
- **Integration Method:**
  - Solana Wallet Adapter (@solana/wallet-adapter)
  - Unified API across all wallets
  - Browser extension & mobile support
- **Authentication:**
  - Wallet connection via `connect()` method
  - Message signing for verification
  - No centralized authentication needed

### Data & Analytics Integrations

**1. Helius RPC & APIs**
- **Purpose:** Enhanced data querying and event listening
- **Services:**
  - RPC endpoint (Devnet/Mainnet)
  - DAS API (Digital Asset Standard)
  - Token metadata API
  - Real-time Webhooks
- **Use Cases:**
  - Listen to tournament events in real-time
  - Query tournament state and player history
  - Monitor USDC transfers
- **Integration:**
  - Set RPC endpoint to Helius URL
  - Use Helius webhooks for event notifications
  - Query tournament data via REST API

**2. Solana Explorer/Blockchain Data**
- **Purpose:** Transparency & verification
- **Integration:**
  - Link to transactions on Solana Explorer
  - Verify tournament state changes
  - Show transaction history to users
- **Benefit:** Full on-chain transparency, no hidden state

### Optional Integrations

**3. Email/Push Notifications**
- **Services:** SendGrid, Firebase Cloud Messaging
- **Use Cases:**
  - Tournament registration confirmation
  - Result announcement
  - Prize claim notifications
  - Registration deadline reminders

**4. User Analytics**
- **Services:** Google Analytics, Mixpanel, Amplitude
- **Metrics:**
  - Tournament creation rate
  - Player registration funnel
  - Prize claim success rate
  - User retention

**5. Identity Verification (if required)**
- **Services:** Civic, Aave Protocol (optional)
- **Purpose:** KYC/AML compliance depending on jurisdiction
- **Integration:** Verify player identity before registration

---

## Detailed Technology Recommendations

### Why Anchor + Rust for Smart Contracts

**Chosen Over Alternatives:**

1. **Native Rust**
   - ❌ Requires extensive boilerplate code
   - ❌ Manual account validation
   - ❌ Higher development time
   - ❌ Greater security risks from manual errors
   - ✅ Anchor abstracts these concerns

2. **Seahorse (Python)**
   - ❌ Still beta (not production-ready)
   - ❌ Community-led, less support
   - ❌ Limited language features
   - ✅ Anchor is battle-tested in production

3. **Solang (Solidity)**
   - ❌ Solidity patterns don't map well to Solana's account model
   - ❌ May miss Solana-specific optimizations
   - ✅ Anchor is idiomatic Solana development

**Anchor Advantages for Tournament System:**
- **Security:** Built-in account validation prevents common exploits
- **Development Speed:** 60-70% less boilerplate code
- **Client Generation:** Automatic TypeScript client from IDL
- **Testing:** Integrated framework with local validator
- **Documentation:** Extensive guides and community examples
- **Ecosystem:** Works with all Solana tools and standards

### Frontend Stack Reasoning

**React + TypeScript**
- ✅ Large ecosystem and component libraries
- ✅ Excellent for reactive UIs (tournament state updates)
- ✅ Strong TypeScript support
- ✅ Easy wallet integration

**Solana Web3.js v2.0 / Umi**
- ✅ Modern, modular architecture
- ✅ Better TypeScript support than v1
- ✅ Plugin system for extensibility
- ✅ Recommended by Solana Foundation
- ❌ Anchor TS client incompatible with v2 (use Codama instead)

**Codama for Client Generation**
- ✅ Generates TypeScript clients from Anchor IDL
- ✅ Works with Web3.js 2.0 / Umi
- ✅ Multi-language support (JS, Python, Rust)
- ✅ Future-proof as Solana ecosystem evolves

**Helius RPC**
- ✅ Specialized for Solana (not generic blockchain)
- ✅ Superior event listening via webhooks
- ✅ Pre-indexed data (DAS API)
- ✅ 99.99% uptime SLA
- ✅ Better for tournament event tracking

### Account Model Understanding

**Why Solana's Account Model Matters for Tournaments:**

Unlike Ethereum's global state trie, Solana separates code (programs) from data (accounts):

```
Solana Architecture:
┌─────────────────────────────────────────┐
│ Tournament Program (Code Account)       │
│ - Immutable after deployment            │
│ - Shared by all tournaments             │
│ - Contains logic                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Tournament #1 Data Accounts             │
│ - Tournament metadata                   │
│ - Player registrations                  │
│ - Prize vault                           │
│ - Mutable and tournament-specific       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Tournament #2 Data Accounts             │
│ - Separate from tournament #1           │
│ - Can be accessed in parallel           │
└─────────────────────────────────────────┘
```

**Parallelization Advantage:**
- Two transactions for different tournaments run in parallel
- Cannot conflict (different account sets)
- Enables 50,000+ TPS vs Ethereum's 15-30 TPS

**Implementation Impact:**
- Each tournament is a separate account
- Player entries are separate accounts (keyed by tournament + player)
- Scales naturally without redeployment

### PDA (Program Derived Address) Architecture

**What PDAs Enable:**

```
Traditional Smart Contracts (e.g., Ethereum):
- User creates account at specific address
- Account holds state
- Private key controls account
- Problem: Need mechanism for contracts to control state

Solana PDAs:
- Derived from program ID + seeds
- No corresponding private key exists
- Only the program can sign for PDAs
- Enables program-controlled escrow!
```

**Tournament Use Case:**

```
Tournament PDA (["tournament", tournament_id]):
├─ Stores tournament metadata
├─ Nobody can steal via private key (no key exists)
└─ Program logic controls updates

Prize Vault PDA (["prize-vault", tournament_key]):
├─ Holds USDC escrow
├─ Cannot be drained (no private key)
├─ Program can sign to release prizes
└─ Guarantees player funds safe until disbursement

Player Entry PDA (["player-entry", tournament, player]):
├─ Proves player registered
├─ Records registration timestamp
├─ Deterministic - same inputs always find account
└─ Enables idempotent operations
```

**Security Guarantee:**
- Funds in vault cannot be stolen (no private key)
- Only program can authorize transfers
- Program authorization validated in code
- Impossible to bypass smart contract logic

---

## Deployment Architecture

### Local Development

```
Developer Machine:
├─ Rust toolchain + Anchor CLI
├─ Local Solana validator (solana-test-validator)
├─ Program deployment to localnet
├─ TypeScript test suite
└─ Real-time contract testing
```

### Devnet Deployment

```
Solana Devnet:
├─ Shared public test network
├─ Free SOL via airdrop (2-5 SOL)
├─ Real blockchain behavior (confirmed via consensus)
├─ Program upgradeable (authority retained)
├─ Reset occasionally (state not permanent)
└─ Ideal for: Integration testing, staging, demo

Frontend:
├─ Devnet RPC endpoint
├─ Phantom wallet on devnet
├─ Test USDC (devnet mint)
└─ Vercel deployment with devnet connection
```

### Mainnet Deployment

```
Solana Mainnet-Beta:
├─ Production blockchain with real value
├─ Transaction fees: 0.00025 SOL (real cost)
├─ USDC cost: real stablecoin with value
├─ Program upgradeable initially (can be revoked)
├─ Permanent state changes
└─ Full security audit required before launch

Deployment Steps:
1. Comprehensive security audit
2. Create multisig for upgrade authority
3. Deploy program (cost: ~2.5-5 SOL depending on size)
4. Retain upgrade authority for bug fixes
5. Eventually revoke upgrade authority (immutable)
6. Launch frontend against mainnet RPC
7. Implement monitoring & alerting
8. Establish incident response procedures
```

---

## Development Workflow

### Smart Contract Development

```
1. Environment Setup
   ├─ Install Rust, Anchor CLI
   ├─ Clone repository
   └─ Run: anchor build

2. Anchor Project Structure
   ├─ programs/tournament/
   │  ├─ src/lib.rs (entry point)
   │  ├─ src/lib/
   │  │  ├─ instructions/ (instruction handlers)
   │  │  ├─ state/ (account structures)
   │  │  └─ errors.rs (custom error codes)
   │  └─ Cargo.toml
   ├─ tests/ (TypeScript tests)
   └─ target/ (build artifacts)

3. Iterative Development
   ├─ Write instruction handler in Rust
   ├─ Run: anchor build (compile)
   ├─ Write test case in TypeScript
   ├─ Run: anchor test (deploy + test locally)
   ├─ Fix issues
   └─ Repeat until tests pass

4. Testing Strategy
   ├─ Unit: Test each instruction in isolation
   ├─ Integration: Test instruction sequences
   ├─ Edge cases: Unauthorized access, invalid states
   ├─ Security: Double registration, overflow/underflow
   └─ Performance: Compute usage measurement

5. Deployment
   ├─ Run: anchor build --release
   ├─ Run: anchor deploy (uploads to configured network)
   ├─ Save Program ID and authority
   └─ Update IDL on-chain: anchor idl init
```

### Frontend Development

```
1. Setup
   ├─ Create React + TypeScript project (Vite or Next.js)
   ├─ Install Anchor dependencies
   └─ Generate TypeScript client from IDL

2. Wallet Integration
   ├─ Add @solana/wallet-adapter
   ├─ Wrap app with WalletProvider
   ├─ Add wallet connect buttons
   └─ Access connected wallet

3. Program Interaction
   ├─ Generate client from program IDL
   ├─ Create instruction builders
   ├─ Handle transaction signing
   ├─ Await confirmation
   └─ Update UI state

4. State Management
   ├─ Use Zustand/Redux for local state
   ├─ Use TanStack Query for server state
   ├─ Cache tournament/player data
   └─ Poll for real-time updates (RPC subscription)

5. Testing
   ├─ Unit tests with Vitest
   ├─ Component tests with React Testing Library
   ├─ E2E tests with Playwright
   └─ Test against localnet or devnet
```

---

## Security Considerations

### Smart Contract Security

**Critical Validation Patterns:**

1. **Account Ownership**
   ```
   Every account passed must be validated:
   - Is it owned by expected program?
   - Is it the account we expect (PDA verification)?
   - Is account initialized?
   ```

2. **Signer Verification**
   ```
   Sensitive operations require:
   - Transaction signer must be specified
   - Use #[account(signer)] in Anchor
   - Prevents unauthorized instruction submission
   ```

3. **Arithmetic Safety**
   ```
   All math operations must be checked:
   - Use checked_add/checked_sub/checked_mul
   - Return error on overflow/underflow
   - Never rely on wrapping behavior
   ```

4. **State Machine Validation**
   ```
   Enforce tournament phase requirements:
   - Can only register in "Registration" phase
   - Can only submit results in "Active" phase
   - Can only distribute prizes in "Ended" phase
   ```

### Escrow Security

**Prize Vault Protection:**

```
✅ Safe Design:
- Vault is PDA (no private key exists)
- Only program can authorize withdrawals
- Program logic validates authorization
- Cannot be drained except by program

❌ Common Mistakes:
- Vault controlled by regular wallet (can steal)
- Missing authorization checks
- Allowing unsigned transactions
- Incorrect CPI signature verification
```

### Recommended Audit Checklist

- [ ] All instructions have proper signer checks
- [ ] All account parameters validated
- [ ] PDA derivation verified in tests
- [ ] Arithmetic operations all checked
- [ ] State transitions enforced
- [ ] Authorization properly verified
- [ ] CPI programs verified (correct program ID)
- [ ] No reentrancy vulnerabilities
- [ ] Prize vault escrow guarantees tested
- [ ] Comprehensive test coverage (>90%)

---

## Testing Strategy

### Smart Contract Tests

```typescript
describe("Tournament System", () => {
  // Setup
  let tournament: PublicKey;
  let admin: Keypair;
  let player1: Keypair;

  before(async () => {
    // Deploy program to local validator
    // Setup test wallets with SOL
    // Create USDC token accounts
  });

  describe("Tournament Creation", () => {
    it("Creates tournament with valid parameters", async () => {
      // Create tournament
      // Verify account initialized
      // Check correct PDA derivation
    });

    it("Rejects invalid parameters", async () => {
      // Test: start_time > end_time
      // Test: max_players = 0
      // Test: negative entry fee
    });
  });

  describe("Player Registration", () => {
    it("Registers player and transfers fees", async () => {
      // Player registers
      // Verify USDC transferred
      // Check player count incremented
    });

    it("Prevents registration when full", async () => {
      // Fill tournament to capacity
      // Attempt registration should fail
    });

    it("Prevents duplicate registration", async () => {
      // Register player
      // Attempt re-registration should fail
    });
  });

  describe("Prize Distribution", () => {
    it("Distributes prizes to winners", async () => {
      // End tournament
      // Distribute to 3 winners
      // Verify USDC in winner accounts
    });

    it("Prevents overpayment", async () => {
      // Attempt to distribute more than pool
      // Should fail with error
    });
  });

  describe("Cancellation & Refunds", () => {
    it("Refunds players when cancelled", async () => {
      // Cancel tournament
      // Players claim refunds
      // Verify USDC returned
    });
  });

  describe("Security", () => {
    it("Rejects unauthorized admin operations", async () => {
      // Non-admin submits results
      // Non-admin distributes prizes
      // Both should fail
    });

    it("Prevents escrow theft", async () => {
      // Attempt direct vault withdrawal
      // Attempt unauthorized CPI
      // Both should fail
    });
  });
});
```

### Performance Testing

```typescript
it("Measures tournament creation compute usage", async () => {
  const tx = await program.methods
    .createTournament(/* params */)
    .rpc();

  const txInfo = await connection.getTransaction(tx);
  const computeUsed = txInfo.meta.computeUnitsConsumed;

  // Target: < 50K compute units
  expect(computeUsed).toBeLessThan(50000);
});
```

---

## Cost Analysis

### Solana Transaction Costs

**Tournament Creation:**
- Program deployment: ~2.5-5 SOL (one-time, ~$250-500)
- Account creation: ~0.002 SOL (~$0.20)
- Per transaction: 0.00025 SOL (~$0.03)

**Player Registration:**
- Token account creation (if new): ~0.002 SOL (~$0.20)
- Registration transaction: 0.00025 SOL (~$0.03)
- USDC fee payment: Variable (set by tournament operator)

**Prize Distribution:**
- Per winner transaction: 0.00025 SOL (~$0.03)
- Can batch multiple winners to save costs

**Cost Comparison (vs Aptos):**
- Solana: ~$0.03 per transaction
- Aptos: Comparable or slightly higher
- **Advantage:** Solana has larger ecosystem and higher reliability

### USDC Economics

**Mainnet USDC:**
- 1 USDC = 1 USD (by definition)
- Available on all major exchanges
- No bridging required (native to Solana)
- Minimal network friction

**Example Tournament Economics:**
```
Tournament: 100 players, 10 USDC entry fee
├─ Total entry fees: 1,000 USDC
├─ Prize pool: 1,000 USDC
├─ Transaction costs: ~$3 (100 registrations + distribution)
├─ Operator profit: $0 (example, no fees collected)
└─ Break-even: Viable even for small tournaments

Different Model: Operator Takes 5%
├─ Operator keeps: 50 USDC ($50)
├─ Prize pool: 950 USDC
├─ Costs: ~$3
└─ Operator net: ~$47 profit per tournament
```

---

## Monitoring & Operations

### Key Metrics to Track

1. **Transaction Success Rate**
   - Target: >99.5%
   - Monitor: Transaction failures, retries
   - Alert if: <99%

2. **Tournament Activity**
   - Tournaments created per week
   - Players registered per tournament
   - Prize pools total per week
   - Prize claims completion rate

3. **Smart Contract Errors**
   - Authorization failures
   - Validation errors
   - State machine violations
   - Alert on any security-related error

4. **Performance**
   - Transaction confirmation time
   - RPC response latency
   - Compute unit usage (optimization opportunity if high)

### Monitoring Tools

1. **Helius Webhooks**
   - Subscribe to tournament instruction events
   - Real-time notification of key actions
   - Custom alerts for unusual patterns

2. **Solana Explorer**
   - Manual verification of transaction success
   - Inspect program state changes
   - Audit trail of all operations

3. **Custom Monitoring Service** (Optional)
   - Listen to program events
   - Index tournament data
   - Alert on anomalies
   - Dashboard for operations team

### Operational Procedures

**Daily Checklist:**
- [ ] Monitor transaction success rate
- [ ] Check for error spikes
- [ ] Review unusual activity patterns
- [ ] Ensure RPC endpoint responsive

**Weekly:**
- [ ] Review tournament success metrics
- [ ] Audit prize distributions
- [ ] Check escrow vault balances

**Pre-Launch:**
- [ ] Establish incident response procedures
- [ ] Define escalation paths
- [ ] Plan for contract upgrade if needed
- [ ] Backup procedures for program authority

---

## Roadmap & Future Enhancements

### Phase 1: MVP (Current)
- ✅ Tournament creation and management
- ✅ Player registration with USDC fees
- ✅ Manual result submission
- ✅ Prize distribution

### Phase 2: Enhanced Features
- Match/bracket tracking within tournaments
- Leaderboards and rankings
- Multi-round tournaments
- Streaming integration (YouTube/Twitch)

### Phase 3: Advanced Functionality
- Betting/prediction markets
- Sponsorship integration
- NFT rewards/badges
- DAO governance for platform

### Phase 4: Scaling
- Cross-chain support (if needed)
- Mobile app support
- Advanced analytics dashboard
- Automated tournament scheduling

---

## Conclusion

**Solana is the optimal choice for Espotz because:**

1. **Cost Efficiency**
   - Transaction fees ~$0.03 (vs higher on other chains)
   - No expensive oracle interactions required
   - Minimal escrow management overhead

2. **Performance**
   - Instant transaction finality (similar to Aptos)
   - High throughput enables multiple concurrent tournaments
   - Low latency for responsive UI

3. **Developer Experience**
   - Anchor framework is battle-tested and industry standard
   - Excellent documentation and community support
   - Rapid development and iteration
   - Easy to attract developers

4. **Security**
   - PDA-based escrow guarantees fund safety
   - Built-in account validation prevents common exploits
   - Rich testing ecosystem (local validator, Bankrun, Surfpool)
   - Professional audit services readily available

5. **Ecosystem**
   - Largest Solana dApp ecosystem
   - Most wallet support (Phantom, Solflare, Ledger, etc.)
   - Mature indexing solutions (Helius)
   - Strong community for support

**Recommended Technology Stack Summary:**

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Smart Contract Language** | Rust | Safe, performant, standard on Solana |
| **Smart Contract Framework** | Anchor | Reduces boilerplate 60-70%, built-in security |
| **Frontend Framework** | React + TypeScript | Large ecosystem, responsive UI, type safety |
| **Blockchain Client** | Solana Web3.js v2 / Umi | Modern, modular, future-proof |
| **Client Generation** | Codama | Auto-generated TypeScript from IDL |
| **Wallet Integration** | Solana Wallet Adapter | Unified API for all wallets |
| **RPC Provider** | Helius | Solana-specialized, webhooks, indexing |
| **Testing** | Anchor Test Framework + Bankrun | Integrated, fast, comprehensive |
| **State Management** | Zustand / Redux | Lightweight or feature-rich options |
| **UI Components** | TailwindCSS + Shadcn/ui | Utility-first, accessible |
| **Deployment** | Vercel (frontend) + Solana (contract) | Serverless, fast, reliable |

**This architecture provides:**
- ✅ Secure escrow of player funds
- ✅ Transparent, immutable result recording
- ✅ Automated prize distribution
- ✅ No oracle dependency
- ✅ Low transaction costs
- ✅ Fast iteration and deployment
- ✅ Scalable to thousands of tournaments

The Solana + Anchor combination has been proven in production for similar DeFi and gaming applications, making it the optimal choice for a high-performance tournament platform.

---

## Appendix: Quick Start Commands

```bash
# Setup Development Environment
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest && avm use latest

# Create New Anchor Project
anchor init espotz-tournament

# Development Workflow
cd espotz-tournament
anchor build                    # Compile smart contract
anchor test                     # Run tests on local validator
anchor deploy                   # Deploy to configured network

# Switch Networks
solana config set --url localhost  # Local development
solana config set --url devnet     # Public testnet
solana config set --url mainnet-beta  # Production

# Useful Commands
solana airdrop 2                    # Get 2 SOL on devnet
solana program show <PROGRAM_ID>    # Verify deployment
solana logs                         # Watch transaction logs
anchor idl init -f target/idl/<program>.json <PROGRAM_ID>  # Deploy IDL
```

---

**Document Version:** 1.0
**Created:** October 2025
**Last Updated:** October 2025
**Status:** Ready for Implementation

