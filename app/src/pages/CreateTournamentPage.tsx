import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, DollarSign, Users, Calendar } from 'lucide-react'

import { GameType, CreateTournamentForm } from '@/types'
import { GAME_TYPE_LABELS } from '@/lib/constants'

export default function CreateTournamentPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<CreateTournamentForm>({
    id: Date.now(),
    gameType: GameType.Fortnite,
    entryFee: '',
    maxPlayers: '',
    startTime: '',
    endTime: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form
      if (!formData.entryFee || parseFloat(formData.entryFee) <= 0) {
        throw new Error('Please enter a valid entry fee')
      }
      if (!formData.maxPlayers || parseInt(formData.maxPlayers) <= 0) {
        throw new Error('Please enter a valid max players count')
      }
      if (!formData.startTime || !formData.endTime) {
        throw new Error('Please select start and end times')
      }

      // Convert to proper format
      const tournamentData = {
        ...formData,
        entryFee: parseFloat(formData.entryFee) * 1e6, // Convert to lamports
        maxPlayers: parseInt(formData.maxPlayers),
        startTime: new Date(formData.startTime).getTime() / 1000,
        endTime: new Date(formData.endTime).getTime() / 1000,
      }

      console.log('Creating tournament:', tournamentData)
      
      // TODO: Call smart contract
      // await createTournament(tournamentData)
      
      // Success
      navigate('/tournaments')
    } catch (error) {
      console.error('Failed to create tournament:', error)
      alert(error instanceof Error ? error.message : 'Failed to create tournament')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateTournamentForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <h1 className="text-2xl font-bold text-secondary-900 mb-6">
          Create New Tournament
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament ID */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Tournament ID
            </label>
            <input
              type="number"
              value={formData.id}
              onChange={(e) => handleInputChange('id')(e)}
              className="input"
              placeholder="Unique tournament identifier"
              required
            />
          </div>

          {/* Game Type */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Game Type
            </label>
            <select
              value={formData.gameType}
              onChange={(e) => handleInputChange('gameType')(e)}
              className="input"
              required
            >
              {Object.entries(GAME_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Entry Fee */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Entry Fee (USDC)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.entryFee}
                onChange={(e) => handleInputChange('entryFee')(e)}
                className="input pl-10"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-xs text-secondary-500 mt-1">
              Players must pay this amount to register
            </p>
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Maximum Players
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="number"
                min="2"
                max="1000"
                value={formData.maxPlayers}
                onChange={(e) => handleInputChange('maxPlayers')(e)}
                className="input pl-10"
                placeholder="100"
                required
              />
            </div>
            <p className="text-xs text-secondary-500 mt-1">
              Maximum number of players allowed
            </p>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Start Time
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime')(e)}
                className="input pl-10"
                required
              />
            </div>
            <p className="text-xs text-secondary-500 mt-1">
              When registration opens
            </p>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              End Time
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime')(e)}
                className="input pl-10"
                required
              />
            </div>
            <p className="text-xs text-secondary-500 mt-1">
              When tournament ends
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={() => navigate('/tournaments')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Tournament...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Create Tournament
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tournament Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          Tournament Preview
        </h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-primary-600" />
            <div>
              <h3 className="font-semibold text-secondary-900">
                {GAME_TYPE_LABELS[formData.gameType]} Tournament
              </h3>
              <p className="text-sm text-secondary-600">
                Tournament #{formData.id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <div className="text-2xl font-bold text-secondary-900 mb-1">
                {formData.maxPlayers || '0'}
              </div>
              <div className="text-sm text-secondary-600">Max Players</div>
            </div>
            
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-900 mb-1">
                ${formData.entryFee || '0.00'}
              </div>
              <div className="text-sm text-primary-600">Entry Fee (USDC)</div>
            </div>
          </div>

          {formData.startTime && formData.endTime && (
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <div className="text-sm text-secondary-600">
                Duration
              </div>
              <div className="font-semibold text-secondary-900">
                {calculateDuration(formData.startTime, formData.endTime)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diff = end.getTime() - start.getTime()
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  
  return parts.join(' ') || '0m'
}