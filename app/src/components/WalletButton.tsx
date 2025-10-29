import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Wallet, WalletNotConnectedError } from '@solana/wallet-adapter-base'
import { 
  WalletMultiButton, 
  useWalletModal,
} from '@solana/wallet-adapter-react-ui'
import { WalletIcon, Copy, Check, AlertCircle } from 'lucide-react'

import { copyToClipboard, shortenAddress } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function WalletButton() {
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet()
  const { setVisible } = useWalletModal()
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async () => {
    if (!publicKey) return
    
    const success = await copyToClipboard(publicKey.toBase58())
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  if (!connected) {
    return (
      <WalletMultiButton 
        className="btn btn-primary w-full"
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        }}
      >
        <div className="flex items-center space-x-2">
          <WalletIcon className="w-4 h-4" />
          <span>Connect Wallet</span>
        </div>
      </WalletMultiButton>
    )
  }

  return (
    <div className="space-y-3">
      {/* Connected wallet info */}
      <div className="bg-secondary-50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-secondary-700">Connected Wallet</span>
          {wallet && (
            <div className="flex items-center space-x-1">
              <img 
                src={wallet.adapter.icon} 
                alt={wallet.adapter.name}
                className="w-4 h-4"
              />
              <span className="text-xs text-secondary-600">{wallet.adapter.name}</span>
            </div>
          )}
        </div>
        
        {publicKey && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm bg-white px-2 py-1 rounded border border-secondary-200">
              {shortenAddress(publicKey.toBase58(), 6)}
            </span>
            <button
              onClick={handleCopyAddress}
              className="p-1 hover:bg-secondary-200 rounded transition-colors"
              title="Copy address"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success-600" />
              ) : (
                <Copy className="w-4 h-4 text-secondary-600" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setVisible(true)}
          className="btn btn-outline flex-1"
        >
          Change Wallet
        </button>
        <button
          onClick={handleDisconnect}
          className="btn btn-danger flex-1"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

// Wallet connection status indicator
export function WalletStatus() {
  const { connected, connecting } = useWallet()

  if (connecting) {
    return (
      <div className="flex items-center space-x-2 text-warning-600">
        <div className="w-2 h-2 bg-warning-600 rounded-full animate-pulse" />
        <span className="text-sm">Connecting...</span>
      </div>
    )
  }

  if (connected) {
    return (
      <div className="flex items-center space-x-2 text-success-600">
        <div className="w-2 h-2 bg-success-600 rounded-full" />
        <span className="text-sm">Connected</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-secondary-600">
      <div className="w-2 h-2 bg-secondary-400 rounded-full" />
      <span className="text-sm">Not Connected</span>
    </div>
  )
}

// Wallet balance display
export function WalletBalance() {
  const { publicKey, connected } = useWallet()
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchBalance = async () => {
    if (!publicKey || !connected) return

    try {
      setLoading(true)
      // Note: This would need connection instance from context
      // const connection = new Connection(RPC_ENDPOINT)
      // const bal = await connection.getBalance(publicKey)
      // setBalance(bal / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchBalance()
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [publicKey, connected])

  if (!connected) {
    return (
      <div className="text-sm text-secondary-600">
        Connect wallet to view balance
      </div>
    )
  }

  return (
    <div className="bg-secondary-50 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-secondary-700">SOL Balance</span>
        {loading ? (
          <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="font-mono text-sm">
            {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
          </span>
        )}
      </div>
    </div>
  )
}