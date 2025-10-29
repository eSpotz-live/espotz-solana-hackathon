import { PublicKey } from '@solana/web3.js'

// Network Configuration
export const RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com'
export const NETWORK = import.meta.env.VITE_NETWORK || 'devnet'

// USDC Token Mint Addresses
export const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
export const USDC_MINT_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
export const USDC_MINT = NETWORK === 'mainnet' ? USDC_MINT_MAINNET : USDC_MINT_DEVNET

// Tournament Program ID (update after deployment)
export const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID || '11111111111111111111111111111111')

// Application Metadata
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Espotz'
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.1.0'

// Solana Program Addresses
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
export const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111')

// PDA Seeds
export const TOURNAMENT_SEED = 'tournament'
export const PLAYER_ENTRY_SEED = 'player-entry'
export const VAULT_AUTHORITY_SEED = 'vault-authority'
export const VAULT_TOKEN_SEED = 'vault-token'

// UI Constants
export const TOAST_DURATION = 5000
export const TRANSACTION_TIMEOUT = 30000
export const POLLING_INTERVAL = 3000

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy HH:mm',
  RELATIVE: 'relative',
}

// Tournament Status Colors
export const TOURNAMENT_STATUS_COLORS = {
  Registration: 'text-blue-600 bg-blue-100',
  Active: 'text-green-600 bg-green-100',
  Ended: 'text-orange-600 bg-orange-100',
  Completed: 'text-purple-600 bg-purple-100',
  Cancelled: 'text-red-600 bg-red-100',
}

// Game Type Labels
export const GAME_TYPE_LABELS = {
  Fortnite: 'Fortnite',
  PubgMobile: 'PUBG Mobile',
  CallOfDutyMobile: 'Call of Duty Mobile',
  Valorant: 'Valorant',
  Apex: 'Apex Legends',
  Warzone: 'Call of Duty: Warzone',
  Other: 'Other',
}

// Explorer URLs
export const getExplorerUrl = (txId: string, type: 'tx' | 'address' = 'tx') => {
  const baseUrl = NETWORK === 'mainnet' 
    ? 'https://explorer.solana.com' 
    : 'https://explorer.solana.com/?cluster=devnet'
  
  return `${baseUrl}/${type}/${txId}`
}