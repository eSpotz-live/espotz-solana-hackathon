import { useState } from 'react'
import { Trophy, DollarSign, User, ExternalLink, Copy } from 'lucide-react'

import { useWallet } from '@solana/wallet-adapter-react'
import { formatUSDC, formatDate, copyToClipboard, shortenAddress } from '@/lib/utils'
import { getExplorerUrl } from '@/lib/constants'

export default function ProfilePage() {
  const { publicKey, connected } = useWallet()
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async () => {
    if (!publicKey) return
    
    const success = await copyToClipboard(publicKey.toBase58())
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!connected) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 mx-auto text-secondary-400 mb-4" />
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">
          Connect Wallet to View Profile
        </h2>
        <p className="text-secondary-600">
          Connect your Solana wallet to view your tournament history and profile information.
        </p>
      </div>
    )
  }

  // Mock user data - would come from backend
  const userStats = {
    tournamentsPlayed: 12,
    tournamentsWon: 3,
    totalWinnings: 150000000, // 150 USDC in lamports
    totalEntryFees: 50000000, // 50 USDC in lamports
    winRate: 25, // 25%
    favoriteGame: 'Fortnite',
  }

  const userTournaments = [
    {
      id: 1,
      gameType: 'Fortnite',
      entryFee: 10000000,
      prizeWon: 50000000,
      position: 1,
      date: Date.now() - 86400000 * 7, // 1 week ago
    },
    {
      id: 2,
      gameType: 'PUBG Mobile',
      entryFee: 5000000,
      prizeWon: 0,
      position: 15,
      date: Date.now() - 86400000 * 3, // 3 weeks ago
    },
    {
      id: 3,
      gameType: 'Valorant',
      entryFee: 20000000,
      prizeWon: 100000000,
      position: 3,
      date: Date.now() - 86400000 * 14, // 2 weeks ago
    },
  ]

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              Player Profile
            </h1>
            <div className="flex items-center space-x-2 text-sm text-secondary-600">
              <span>Wallet:</span>
              <span className="font-mono bg-secondary-100 px-2 py-1 rounded">
                {shortenAddress(publicKey.toBase58(), 6)}
              </span>
              <button
                onClick={handleCopyAddress}
                className="p-1 hover:bg-secondary-200 rounded transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <div className="w-4 h-4 text-success-600">✓</div>
                ) : (
                  <Copy className="w-4 h-4 text-secondary-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {userStats.tournamentsPlayed}
            </div>
            <div className="text-sm text-secondary-600">Tournaments Played</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-success-600 mb-1">
              {userStats.tournamentsWon}
            </div>
            <div className="text-sm text-secondary-600">Tournaments Won</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-900 mb-1">
              {formatUSDC(userStats.totalWinnings)}
            </div>
            <div className="text-sm text-secondary-600">Total Winnings</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary-900 mb-1">
              {formatUSDC(userStats.totalEntryFees)}
            </div>
            <div className="text-sm text-secondary-600">Total Entry Fees</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-warning-600 mb-1">
              {userStats.winRate}%
            </div>
            <div className="text-sm text-secondary-600">Win Rate</div>
          </div>
        </div>
      </div>

      {/* Favorite Game */}
      <div className="border-t border-secondary-200 pt-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          Favorite Game
        </h2>
        <div className="flex items-center space-x-3">
          <div className="text-3xl">🎯</div>
          <div>
            <div className="font-semibold text-secondary-900">
              {userStats.favoriteGame}
            </div>
            <div className="text-sm text-secondary-600">
              Most played game
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Tournament History */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          Tournament History
        </h2>
        
        <div className="space-y-3">
          {userTournaments.map((tournament, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {getGameEmoji(tournament.gameType)}
                  </div>
                  <div>
                    <div className="font-semibold text-secondary-900">
                      {tournament.gameType} Tournament #{tournament.id}
                    </div>
                    <div className="text-sm text-secondary-600">
                      {formatDate(tournament.date, 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-secondary-600">
                  Entry: {formatUSDC(tournament.entryFee)}
                </div>
              </div>
              
              <div className="text-right">
                {tournament.prizeWon > 0 ? (
                  <div className="text-success-600">
                    <div className="font-semibold">+{formatUSDC(tournament.prizeWon)}</div>
                    <div className="text-xs">Position #{tournament.position}</div>
                  </div>
                ) : (
                  <div className="text-secondary-600">
                    <div className="font-semibold">#{tournament.position}</div>
                    <div className="text-xs">No winnings</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {userTournaments.length === 0 && (
          <div className="text-center py-8 text-secondary-600">
            No tournaments played yet. Join your first tournament to get started!
          </div>
        )}
      </div>

      {/* Wallet Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          Wallet Actions
        </h2>
        
        <div className="space-y-3">
          <a
            href={getExplorerUrl(publicKey.toBase58(), 'address')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <div>
              <div className="font-medium text-secondary-900">View on Solana Explorer</div>
              <div className="text-sm text-secondary-600">
                See all transactions and account details
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-secondary-600" />
          </a>
          
          <button className="w-full btn btn-outline">
            Export Transaction History
          </button>
        </div>
      </div>
    </div>
  )
}

function getGameEmoji(gameType: string): string {
  const emojiMap: Record<string, string> = {
    'Fortnite': '🎯',
    'PUBG Mobile': '🎮',
    'Valorant': '🔫',
  }
  return emojiMap[gameType] || '🎮'
}