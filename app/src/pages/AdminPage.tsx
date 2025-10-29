import { useState } from 'react'
import { Trophy, Users, DollarSign, Settings, Play, Plus } from 'lucide-react'

import { TournamentStatus, GameType } from '@/types'
import { GAME_TYPE_LABELS } from '@/lib/constants'

// Mock data - would come from smart contract
const mockTournaments = [
  {
    id: 1,
    status: TournamentStatus.Registration,
    gameType: GameType.Fortnite,
    entryFee: 10000000,
    maxPlayers: 100,
    currentPlayers: 45,
    startTime: Date.now() + 86400000,
    endTime: Date.now() + 172800000,
  },
  {
    id: 2,
    status: TournamentStatus.Active,
    gameType: GameType.PubgMobile,
    entryFee: 5000000,
    maxPlayers: 50,
    currentPlayers: 50,
    startTime: Date.now() - 3600000,
    endTime: Date.now() + 7200000,
  },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'results' | 'settings'>('tournaments')

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <h1 className="text-2xl font-bold text-secondary-900 mb-6">
          Admin Dashboard
        </h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 border-b border-secondary-200">
          {[
            { id: 'tournaments', label: 'My Tournaments', icon: Trophy },
            { id: 'results', label: 'Manage Results', icon: Play },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-secondary-600 hover:text-secondary-900'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'tournaments' && <TournamentsManagement />}
        {activeTab === 'results' && <ResultsManagement />}
        {activeTab === 'settings' && <SettingsManagement />}
      </div>
    </div>
  )
}

function TournamentsManagement() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-secondary-900">My Tournaments</h2>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create New Tournament
        </button>
      </div>

      {/* Tournaments List */}
      <div className="space-y-3">
        {mockTournaments.map(tournament => (
          <div key={tournament.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-secondary-900">
                  {GAME_TYPE_LABELS[tournament.gameType]} Tournament #{tournament.id}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-secondary-600">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {tournament.currentPlayers}/{tournament.maxPlayers}
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {(tournament.entryFee / 1e6).toFixed(2)} USDC
                  </span>
                </div>
              </div>
              
              <div className={`badge ${
                tournament.status === TournamentStatus.Registration ? 'status-registration' :
                tournament.status === TournamentStatus.Active ? 'status-active' :
                tournament.status === TournamentStatus.Ended ? 'status-ended' :
                tournament.status === TournamentStatus.Completed ? 'status-completed' :
                'status-cancelled'
              }`}>
                {tournament.status}
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="btn btn-outline btn-sm">
                View Details
              </button>
              {tournament.status === TournamentStatus.Registration && (
                <button className="btn btn-primary btn-sm">
                  Start Tournament
                </button>
              )}
              {tournament.status === TournamentStatus.Active && (
                <button className="btn btn-secondary btn-sm">
                  Submit Results
                </button>
              )}
              {tournament.status === TournamentStatus.Ended && (
                <button className="btn btn-primary btn-sm">
                  Distribute Prizes
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultsManagement() {
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null)
  const [winners, setWinners] = useState<string[]>([''])
  const [amounts, setAmounts] = useState<string[]>([''])

  const handleAddWinner = () => {
    setWinners([...winners, ''])
    setAmounts([...amounts, ''])
  }

  const handleWinnerChange = (index: number, value: string) => {
    const newWinners = [...winners]
    newWinners[index] = value
    setWinners(newWinners)
  }

  const handleAmountChange = (index: number, value: string) => {
    const newAmounts = [...amounts]
    newAmounts[index] = value
    setAmounts(newAmounts)
  }

  const handleRemoveWinner = (index: number) => {
    setWinners(winners.filter((_, i) => i !== index))
    setAmounts(amounts.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-secondary-900 mb-4">Submit Tournament Results</h2>
      
      {/* Tournament Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Select Tournament
        </label>
        <select className="input">
          <option value="">Choose a tournament...</option>
          {mockTournaments.map(tournament => (
            <option key={tournament.id} value={tournament.id}>
              {GAME_TYPE_LABELS[tournament.gameType]} Tournament #{tournament.id}
            </option>
          ))}
        </select>
      </div>

      {/* Winners Input */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-secondary-900 mb-3">Winners</h3>
        {winners.map((winner, index) => (
          <div key={index} className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Winner wallet address"
              value={winner}
              onChange={(e) => handleWinnerChange(index, e.target.value)}
              className="input flex-1"
            />
            <button
              type="button"
              onClick={() => handleRemoveWinner(index)}
              className="btn btn-danger btn-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddWinner}
          className="btn btn-outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Winner
        </button>
      </div>

      {/* Prize Amounts */}
      <div className="space-y-4">
        <h3 className="text-md font-medium text-secondary-900 mb-3">Prize Amounts (USDC)</h3>
        {amounts.map((amount, index) => (
          <div key={index} className="flex items-center space-x-3">
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => handleAmountChange(index, e.target.value)}
              className="input flex-1"
            />
            <button
              type="button"
              onClick={() => handleRemoveWinner(index)}
              className="btn btn-danger btn-sm"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddWinner}
          className="btn btn-outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Prize
        </button>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button className="btn btn-primary">
          Submit Results
        </button>
      </div>
    </div>
  )
}

function SettingsManagement() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-secondary-900 mb-4">Admin Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-secondary-700">Default Entry Fee (USDC)</label>
            <input
              type="number"
              step="0.01"
              defaultValue="5.00"
              className="input mt-1 w-32"
            />
          </div>
          <button className="btn btn-outline">Save</button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-secondary-700">Max Players Default</label>
            <input
              type="number"
              defaultValue="100"
              className="input mt-1 w-32"
            />
          </div>
          <button className="btn btn-outline">Save</button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-secondary-700">Tournament Duration (hours)</label>
            <input
              type="number"
              defaultValue="24"
              className="input mt-1 w-32"
            />
          </div>
          <button className="btn btn-outline">Save</button>
        </div>
      </div>
    </div>
  )
}