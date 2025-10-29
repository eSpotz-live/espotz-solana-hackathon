import { PublicKey } from '@solana/web3.js'

// Tournament Status enum (matches smart contract)
export enum TournamentStatus {
  Registration = 'Registration',
  Active = 'Active',
  Ended = 'Ended',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

// Game Type enum (matches smart contract)
export enum GameType {
  Fortnite = 'Fortnite',
  PubgMobile = 'PubgMobile',
  CallOfDutyMobile = 'CallOfDutyMobile',
  Valorant = 'Valorant',
  Apex = 'Apex',
  Warzone = 'Warzone',
  Other = 'Other',
}

// Tournament account structure (matches smart contract)
export interface Tournament {
  id: number
  admin: PublicKey
  status: TournamentStatus
  gameType: GameType
  entryFee: number
  prizePool: number
  maxPlayers: number
  currentPlayers: number
  startTime: number
  endTime: number
  bump: number
  publicKey: PublicKey
}

// Player entry structure (matches smart contract)
export interface PlayerEntry {
  tournament: PublicKey
  player: PublicKey
  entryTime: number
  refunded: boolean
  bump: number
  publicKey: PublicKey
}

// Vault authority structure (matches smart contract)
export interface VaultAuthority {
  tournament: PublicKey
  bump: number
  publicKey: PublicKey
}

// Extended tournament data for UI
export interface TournamentWithInfo extends Tournament {
  timeRemaining?: {
    days: number
    hours: number
    minutes: number
    seconds: number
    isPast: boolean
  }
  isUserRegistered?: boolean
  canUserRegister?: boolean
  canUserCancel?: boolean
  canUserStart?: boolean
  canUserSubmitResults?: boolean
  canUserDistributePrizes?: boolean
}

// Player registration info
export interface PlayerRegistration {
  tournament: PublicKey
  player: PublicKey
  entryFee: number
  timestamp: number
}

// Prize distribution info
export interface PrizeDistribution {
  winner: PublicKey
  amount: number
}

// Tournament creation form data
export interface CreateTournamentForm {
  id: number
  gameType: GameType
  entryFee: string
  maxPlayers: string
  startTime: string
  endTime: string
}

// Result submission form data
export interface SubmitResultsForm {
  winners: string[]
  amounts: string[]
}

// Transaction state
export interface TransactionState {
  status: 'idle' | 'loading' | 'success' | 'error'
  txId?: string
  error?: string
}

// Wallet connection state
export interface WalletState {
  connected: boolean
  connecting: boolean
  disconnecting: boolean
  publicKey?: PublicKey
  walletName?: string
}

// Toast notification types
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Application store state
export interface AppState {
  // Wallet state
  wallet: WalletState
  
  // Tournament state
  tournaments: TournamentWithInfo[]
  selectedTournament?: TournamentWithInfo
  loadingTournaments: boolean
  
  // Player entries
  playerEntries: PlayerEntry[]
  loadingPlayerEntries: boolean
  
  // UI state
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  
  // Transaction state
  transactions: Record<string, TransactionState>
  
  // Notifications
  toasts: Toast[]
}

// Event types from smart contract
export interface TournamentCreatedEvent {
  tournament: PublicKey
  admin: PublicKey
  id: number
  gameType: GameType
  entryFee: number
  maxPlayers: number
  startTime: number
  endTime: number
}

export interface PlayerRegisteredEvent {
  tournament: PublicKey
  player: PublicKey
  entryTime: number
  currentPlayers: number
}

export interface TournamentStartedEvent {
  tournament: PublicKey
  timestamp: number
}

export interface ResultsSubmittedEvent {
  tournament: PublicKey
  winners: PublicKey[]
  timestamp: number
}

export interface PrizesDistributedEvent {
  tournament: PublicKey
  winners: PublicKey[]
  amounts: number[]
  timestamp: number
}

export interface TournamentCancelledEvent {
  tournament: PublicKey
  timestamp: number
}

export interface RefundClaimedEvent {
  tournament: PublicKey
  player: PublicKey
  amount: number
  timestamp: number
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Pagination types
export interface Pagination {
  page: number
  limit: number
  total: number
  hasMore: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination
}

// Filter and sort options
export interface TournamentFilters {
  status?: TournamentStatus[]
  gameType?: GameType[]
  minEntryFee?: number
  maxEntryFee?: number
  admin?: PublicKey
  search?: string
}

export interface TournamentSort {
  field: 'startTime' | 'endTime' | 'entryFee' | 'prizePool' | 'currentPlayers'
  direction: 'asc' | 'desc'
}

// Component props
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface InputProps extends BaseComponentProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
  label?: string
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}