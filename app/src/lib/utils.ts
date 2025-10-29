import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PublicKey } from '@solana/web3.js'
import { format, formatDistanceToNow, parseISO } from 'date-fns'

// Utility function for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format SOL/Lamports to readable amount
export function formatLamports(lamports: number | string): string {
  const sol = Number(lamports) / 1e9
  return sol.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 9,
  })
}

// Format USDC amount (6 decimals)
export function formatUSDC(amount: number | string): string {
  const usdc = Number(amount) / 1e6
  return usdc.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

// Convert USDC to lamports (6 decimals)
export function usdcToLamports(usdc: number): number {
  return Math.floor(usdc * 1e6)
}

// Convert lamports to USDC (6 decimals)
export function lamportsToUSDC(lamports: number): number {
  return lamports / 1e6
}

// Shorten wallet address for display
export function shortenAddress(address: string | PublicKey, chars = 4): string {
  const str = typeof address === 'string' ? address : address.toBase58()
  return `${str.slice(0, chars)}...${str.slice(-chars)}`
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

// Format date with fallback
export function formatDate(date: Date | string | number, formatStr = 'MMM dd, yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    return format(dateObj, formatStr)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

// Format relative time
export function formatRelativeTime(date: Date | string | number): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date)
    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return 'Unknown time'
  }
}

// Validate Solana address
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

// Sleep utility for delays
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Retry utility for async operations
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.warn(`Attempt ${attempt} failed:`, error)
      
      if (attempt < maxAttempts) {
        await sleep(delay * attempt)
      }
    }
  }

  throw lastError!
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Check if mobile device
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

// Get network name from RPC endpoint
export function getNetworkName(rpcEndpoint: string): string {
  if (rpcEndpoint.includes('devnet')) return 'Devnet'
  if (rpcEndpoint.includes('mainnet')) return 'Mainnet'
  if (rpcEndpoint.includes('localhost') || rpcEndpoint.includes('127.0.0.1')) return 'Localnet'
  return 'Unknown'
}

// Calculate time remaining
export function getTimeRemaining(endTime: Date | string | number): {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
} {
  const end = new Date(endTime)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  
  const isPast = diff <= 0
  
  if (isPast) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return { days, hours, minutes, seconds, isPast: false }
}