import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, Trophy, Clock, DollarSign, ExternalLink } from 'lucide-react'

import { TournamentWithInfo, TournamentStatus } from '@/types'
import { formatUSDC, formatDate, getTimeRemaining } from '@/lib/utils'
import { GAME_TYPE_LABELS, TOURNAMENT_STATUS_COLORS, getExplorerUrl } from '@/lib/constants'

// Mock tournament data - would come from smart contract
const mockTournament: TournamentWithInfo = {
  id: 1,
  admin: new PublicKey('11111111111111111111111111111111'),
  status: TournamentStatus.Registration,
  gameType: GameType.Fortnite,
  entryFee: 10000000, // 10 USDC
  prizePool: 50000000, // 50 USDC
  maxPlayers: 100,
  currentPlayers: 45,
  startTime: Date.now() + 86400000, // Tomorrow
  endTime: Date.now() + 172800000, // 2 days
  bump: 255,
  publicKey: new PublicKey('11111111111111111111111111111111'),
  timeRemaining: getTimeRemaining(Date.now() + 86400000),
  isUserRegistered: false,
  canUserRegister: true,
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const tournament = mockTournament // In real app, fetch by ID

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-secondary-900 mb-4">
          Tournament Not Found
        </h1>
        <p className="text-secondary-600 mb-6">
          The tournament you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/tournaments" className="btn btn-primary">
          Back to Tournaments
        </Link>
      </div>
    )
  }

  const getStatusColor = () => {
    return TOURNAMENT_STATUS_COLORS[tournament.status] || 'text-secondary-600 bg-secondary-100'
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center space-x-4 text-sm">
        <Link
          to="/tournaments"
          className="flex items-center text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Tournaments
        </Link>
        <span className="text-secondary-400">/</span>
        <span className="font-medium">Tournament #{tournament.id}</span>
      </div>

      {/* Tournament Header */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="text-3xl">
                {getGameEmoji(tournament.gameType)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  {GAME_TYPE_LABELS[tournament.gameType]}
                </h1>
                <p className="text-secondary-600">
                  Tournament #{tournament.id}
                </p>
              </div>
            </div>
            
            <div className={`badge ${getStatusColor()}`}>
              {tournament.status}
            </div>
          </div>

          {/* Tournament Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center text-secondary-600 mb-1">
                <Users className="w-4 h-4 mr-1" />
                <span className="text-sm">{tournament.currentPlayers}/{tournament.maxPlayers}</span>
              </div>
              <div className="text-xs text-secondary-500">Players</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-secondary-600 mb-1">
                <DollarSign className="w-4 h-4 mr-1" />
                <span className="text-sm">{formatUSDC(tournament.prizePool)}</span>
              </div>
              <div className="text-xs text-secondary-500">Prize Pool</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-secondary-600 mb-1">
                <DollarSign className="w-4 h-4 mr-1" />
                <span className="text-sm">{formatUSDC(tournament.entryFee)}</span>
              </div>
              <div className="text-xs text-secondary-500">Entry Fee</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-secondary-600 mb-1">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-sm">
                  {tournament.timeRemaining && !tournament.timeRemaining.isPast
                    ? `${tournament.timeRemaining.days}d ${tournament.timeRemaining.hours}h`
                    : 'Ended'
                  }
                </span>
              </div>
              <div className="text-xs text-secondary-500">Time Remaining</div>
            </div>
          </div>
        </div>

        {/* Time Details */}
        <div className="border-t border-secondary-200 pt-4">
          <h3 className="text-lg font-semibold text-secondary-900 mb-3">
            Tournament Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-secondary-600 mb-1">Start Time</div>
              <div className="font-medium">
                {formatDate(tournament.startTime, 'MMMM dd, yyyy HH:mm')}
              </div>
            </div>
            <div>
              <div className="text-sm text-secondary-600 mb-1">End Time</div>
              <div className="font-medium">
                {formatDate(tournament.endTime, 'MMMM dd, yyyy HH:mm')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {tournament.canUserRegister && (
            <button className="btn btn-primary flex-1">
              Register for Tournament
            </button>
          )}
          
          {tournament.isUserRegistered && (
            <div className="flex-1 p-4 bg-success-50 rounded-lg">
              <div className="flex items-center text-success-700">
                <Trophy className="w-5 h-5 mr-2" />
                <span className="font-medium">You are registered!</span>
              </div>
            </div>
          )}
          
          <Link
            to={`/tournaments/${tournament.id}/leaderboard`}
            className="btn btn-outline flex-1"
          >
            View Leaderboard
          </Link>
        </div>
      </div>

      {/* Tournament Rules */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Tournament Rules
        </h3>
        <div className="space-y-3 text-sm text-secondary-600">
          <p>• Registration closes when tournament starts or reaches max capacity</p>
          <p>• Entry fee is non-refundable unless tournament is cancelled</p>
          <p>• Results are submitted by tournament operator</p>
          <p>• Prizes are distributed automatically to winners</p>
          <p>• All transactions are recorded on-chain for transparency</p>
        </div>
      </div>

      {/* Blockchain Info */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Blockchain Information
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-600">Tournament Address</span>
            <a
              href={getExplorerUrl(tournament.publicKey.toBase58(), 'address')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-mono"
            >
              {tournament.publicKey.toBase58().slice(0, 8)}...
              {tournament.publicKey.toBase58().slice(-8)}
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-600">Administrator</span>
            <a
              href={getExplorerUrl(tournament.admin.toBase58(), 'address')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-mono"
            >
              {tournament.admin.toBase58().slice(0, 8)}...
              {tournament.admin.toBase58().slice(-8)}
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function getGameEmoji(gameType: string): string {
  const emojiMap: Record<string, string> = {
    Fortnite: '🎯',
    PubgMobile: '🎮',
    CallOfDutyMobile: '🔫',
    Valorant: '🔫',
    Apex: '🏃',
    Warzone: '⚔️',
    Other: '🎲',
  }
  return emojiMap[gameType] || '🎮'
}