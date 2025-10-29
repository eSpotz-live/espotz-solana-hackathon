import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { 
  Connection, 
  PublicKey, 
  clusterApiUrl,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js'
import { 
  useWallet, 
  WalletContextState,
  WalletNotConnectedError 
} from '@solana/wallet-adapter-react'
import { 
  WalletAdapterNetwork, 
  WalletError 
} from '@solana/wallet-adapter-base'

import { RPC_ENDPOINT, NETWORK } from '@/lib/constants'
import { WalletState, TransactionState } from '@/types'

// Action types
type WalletAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: { publicKey: PublicKey; walletName: string } }
  | { type: 'SET_DISCONNECTED' }
  | { type: 'SET_DISCONNECTING'; payload: boolean }
  | { type: 'SET_TRANSACTION_STATE'; payload: { id: string; state: TransactionState } }
  | { type: 'CLEAR_TRANSACTION_STATE'; payload: string }

// Initial state
const initialState: WalletState = {
  connected: false,
  connecting: false,
  disconnecting: false,
}

// Reducer
function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, connecting: action.payload }
    
    case 'SET_CONNECTED':
      return {
        ...state,
        connected: true,
        connecting: false,
        publicKey: action.payload.publicKey,
        walletName: action.payload.walletName,
      }
    
    case 'SET_DISCONNECTING':
      return { ...state, disconnecting: action.payload }
    
    case 'SET_DISCONNECTED':
      return {
        ...state,
        connected: false,
        connecting: false,
        disconnecting: false,
        publicKey: undefined,
        walletName: undefined,
      }
    
    case 'SET_TRANSACTION_STATE':
      return {
        ...state,
        transactions: {
          ...state.transactions,
          [action.payload.id]: action.payload.state,
        },
      }
    
    case 'CLEAR_TRANSACTION_STATE':
      const { [action.payload]: _, ...rest } = state.transactions || {}
      return {
        ...state,
        transactions: rest,
      }
    
    default:
      return state
  }
}

// Context type
interface WalletContextType extends WalletState {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  getBalance: () => Promise<number>
  sendTransaction: (transaction: any, description?: string) => Promise<string>
  getTransactionState: (id: string) => TransactionState | undefined
  clearTransactionState: (id: string) => void
}

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined)

// Provider component
interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const { 
    publicKey, 
    connect, 
    disconnect, 
    connected, 
    connecting,
    wallet,
    select,
  } = useWallet()
  
  const [state, dispatch] = useReducer(walletReducer, initialState)
  
  // Connection instance
  const connection = new Connection(RPC_ENDPOINT, 'confirmed')
  
  // Sync with wallet adapter state
  useEffect(() => {
    if (connected && publicKey && wallet) {
      dispatch({
        type: 'SET_CONNECTED',
        payload: {
          publicKey,
          walletName: wallet.adapter.name,
        },
      })
    } else if (!connected && state.connected) {
      dispatch({ type: 'SET_DISCONNECTED' })
    }
  }, [connected, publicKey, wallet, state.connected])
  
  useEffect(() => {
    dispatch({ type: 'SET_CONNECTING', payload: connecting })
  }, [connecting])
  
  // Connect wallet
  const handleConnect = async (): Promise<void> => {
    try {
      if (!select) {
        throw new Error('Wallet selection not available')
      }
      
      // Try to connect with Phantom first, then fallback to available wallets
      try {
        await select('Phantom')
      } catch {
        // Fallback to first available wallet
        const wallets = [
          'Solflare',
          'Backpack',
          'Trust',
        ]
        
        for (const walletName of wallets) {
          try {
            await select(walletName)
            break
          } catch {
            continue
          }
        }
      }
      
      await connect()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }
  
  // Disconnect wallet
  const handleDisconnect = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_DISCONNECTING', payload: true })
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
  }
  
  // Get SOL balance
  const getBalance = async (): Promise<number> => {
    if (!publicKey) {
      throw new WalletNotConnectedError()
    }
    
    try {
      const balance = await connection.getBalance(publicKey)
      return balance / LAMPORTS_PER_SOL
    } catch (error) {
      console.error('Failed to get balance:', error)
      throw error
    }
  }
  
  // Send transaction with tracking
  const sendTransaction = async (transaction: any, description?: string): Promise<string> => {
    if (!publicKey || !wallet) {
      throw new WalletNotConnectedError()
    }
    
    const txId = generateTransactionId()
    
    try {
      // Set loading state
      dispatch({
        type: 'SET_TRANSACTION_STATE',
        payload: {
          id: txId,
          state: {
            status: 'loading',
            error: undefined,
          },
        },
      })
      
      // Send transaction
      const signature = await wallet.adapter.sendTransaction(transaction, connection)
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')
      
      // Update state to success
      dispatch({
        type: 'SET_TRANSACTION_STATE',
        payload: {
          id: txId,
          state: {
            status: 'success',
            txId: signature,
          },
        },
      })
      
      // Clear after delay
      setTimeout(() => {
        dispatch({ type: 'CLEAR_TRANSACTION_STATE', payload: txId })
      }, 5000)
      
      return signature
    } catch (error) {
      // Update state to error
      dispatch({
        type: 'SET_TRANSACTION_STATE',
        payload: {
          id: txId,
          state: {
            status: 'error',
            error: error instanceof Error ? error.message : 'Transaction failed',
          },
        },
      })
      
      throw error
    }
  }
  
  // Get transaction state
  const getTransactionState = (id: string): TransactionState | undefined => {
    return state.transactions?.[id]
  }
  
  // Clear transaction state
  const clearTransactionState = (id: string): void => {
    dispatch({ type: 'CLEAR_TRANSACTION_STATE', payload: id })
  }
  
  const value: WalletContextType = {
    ...state,
    connect: handleConnect,
    disconnect: handleDisconnect,
    getBalance,
    sendTransaction,
    getTransactionState,
    clearTransactionState,
  }
  
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

// Hook to use wallet context
export function useWalletContext(): WalletContextType {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider')
  }
  return context
}

// Helper function to generate transaction ID
function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Export connection instance for use in other components
export { connection }