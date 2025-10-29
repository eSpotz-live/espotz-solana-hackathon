import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Trophy, Clock, Users, DollarSign } from 'lucide-react'

import { TournamentWithInfo, TournamentStatus, GameType } from '@/types'
import { formatUSDC, formatDate, formatRelativeTime, getTimeRemaining } from '@/lib/utils'
import { GAME_TYPE_LABELS, TOURNAMENT_STATUS_COLORS } from '@/lib/constants'

// Mock data - would come from smart contract
const mockTournaments: TournamentWithInfo[] = [
  {
    id: 1,
    admin: new PublicKey('11111111111111111111111111111111111'),
    status: TournamentStatus.Registration,
    gameType: GameType.Fortnite,
    entryFee: 10000000, // 10 USDC
    prizePool: 50000000, // 50 USDC
    maxPlayers: 100,
    currentPlayers: 45,
    startTime: Date.now() + 86400000, // Tomorrow
    endTime: Date.now() + 172800000, // 2 days
    bump: 255,
    publicKey: new PublicKey('11111111111111111111111111111111111'),
    timeRemaining: getTimeRemaining(Date.now() + 86400000),
    isUserRegistered: false,
    canUserRegister: true,
  },
  {
    id: 2,
    admin: new PublicKey('11111111111111111111111111111111111'),
    status: TournamentStatus.Active,
    gameType: GameType.PubgMobile,
    entryFee: 5000000, // 5 USDC
    prizePool: 25000000, // 25 USDC
    maxPlayers: 50,
    currentPlayers: 50,
    startTime: Date.now() - 3600000, // 1 hour ago
    endTime: Date.now() + 7200000, // 2 hours from now
    bump: 255,
    publicKey: new PublicKey('11111111111111111111111111111111111'),
    timeRemaining: getTimeRemaining(Date.now() + 7200000),
    isUserRegistered: true,
    canUserRegister: false,
  },
  {
    id: 3,
    admin: new PublicKey('11111111111111111111111111111111111'),
    status: TournamentStatus.Ended,
    gameType: GameType.Valorant,
    entryFee: 20000000, // 20 USDC
    prizePool: 40000000, // 40 USDC
    maxPlayers: 32,
    currentPlayers: 32,
    startTime: Date.now() - 86400000, // 1 day ago
    endTime: Date.now() - 3600000, // 1 hour ago
    bump: 255,
    publicKey: new PublicKey('11111111111111111111111111111111111'),
    timeRemaining: getTimeRemaining(Date.now() - 3600000),
    isUserRegistered: false,
    canUserRegister: false,
  },
]

export default function TournamentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'all'>('all')
  const [gameFilter, setGameFilter] = useState<GameType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'startTime' | 'prizePool' | 'players'>('startTime')
  const [tournaments, setTournaments] = useState<TournamentWithInfo[]>(mockTournaments)

  // Filter tournaments
  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.id.toString().includes(searchTerm) ||
                         GAME_TYPE_LABELS[tournament.gameType].toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter
    const matchesGame = gameFilter === 'all' || tournament.gameType === gameFilter
    
    return matchesSearch && matchesStatus && matchesGame
  }).sort((a, b) => {
    switch (sortBy) {
      case 'startTime':
        return b.startTime - a.startTime
      case 'prizePool':
        return b.prizePool - a.prizePool
      case 'players':
        return b.currentPlayers - a.currentPlayers
      default:
        return 0
    }
  })

  const getStatusColor = (status: TournamentStatus) => {
    return TOURNAMENT_STATUS_COLORS[status] || 'text-secondary-600 bg-secondary-100'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <h1 className="text-2xl font-bold text-secondary-900 mb-6">
          Tournament Listings
        </h1>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TournamentStatus | 'all')}
            className="input"
          >
            <option value="all">All Status</option>
            {Object.values(TournamentStatus).map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value as GameType | 'all')}
            className="input"
          >
            <option value="all">All Games</option>
            {Object.values(GameType).map(game => (
              <option key={game} value={game}>
                {GAME_TYPE_LABELS[game]}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'startTime' | 'prizePool' | 'players')}
            className="input"
          >
            <option value="startTime">Start Time</option>
            <option value="prizePool">Prize Pool</option>
            <option value="players">Players</option>
          </select>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="card card-hover"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="text-2xl">
                  {getGameEmoji(tournament.gameType)}
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900">
                    {GAME_TYPE_LABELS[tournament.gameType]}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    Tournament #{tournament.id}
                  </p>
                </div>
              </div>
              
              <div className={`badge ${getStatusColor(tournament.status)}`}>
                {tournament.status}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
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
            </div>

            {/* Time Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-secondary-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>Start: {formatDate(tournament.startTime, 'MMM dd, HH:mm')}</span>
              </div>
              <div className="flex items-center text-sm text-secondary-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>End: {formatDate(tournament.endTime, 'MMM dd, HH:mm')}</span>
              </div>
              {tournament.timeRemaining && !tournament.timeRemaining.isPast && (
                <div className="text-sm text-primary-600 font-medium">
                  {tournament.timeRemaining.days > 0 && `${tournament.timeRemaining.days}d `}
                  {tournament.timeRemaining.hours > 0 && `${tournament.timeRemaining.hours}h `}
                  {tournament.timeRemaining.minutes > 0 && `${tournament.timeRemaining.minutes}m`}
                  remaining
                </div>
              )}
            </div>

            {/* Entry Fee */}
            <div className="flex items-center justify-between pt-4 border-t border-secondary-200">
              <div>
                <span className="text-sm text-secondary-600">Entry Fee</span>
                <div className="font-semibold text-secondary-900">
                  {formatUSDC(tournament.entryFee)}
                </div>
              </div>
              
              <Link
                to={`/tournaments/${tournament.id}`}
                className="btn btn-primary"
              >
                View Details
              </Link>
            </div>

            {/* Registration Status */}
            {tournament.isUserRegistered && (
              <div className="mt-3 p-2 bg-success-50 rounded-lg">
                <div className="flex items-center text-success-700 text-sm">
                  <Trophy className="w-4 h-4 mr-2" />
                  You are registered for this tournament
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTournaments.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto text-secondary-400 mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            No tournaments found
          </h3>
          <p className="text-secondary-600">
            Try adjusting your filters or check back later for new tournaments.
          </p>
        </div>
      )}
    </div>
  )
}

function getGameEmoji(gameType: GameType): string {
  const emojiMap: Record<GameType, string> = {
    [GameType.Fortnite]: '🎯',
    [GameType.PubgMobile]: '🎮',
    [GameType.CallOfDutyMobile]: '🔫',
    [GameType.Valorant]: '🔫',
    [GameType.Apex]: '🏃',
    [GameType.Warzone]: '⚔️',
    [GameType.Other]: '🎲',
  }
  return emojiMap[gameType] || '🎮'
}