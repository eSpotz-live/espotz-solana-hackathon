import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { Trophy, Users, DollarSign, TrendingUp, Play } from 'lucide-react'

import { GAME_TYPE_LABELS } from '@/lib/constants'

export default function HomePage() {
  const { connected } = useWallet()

  const features = [
    {
      icon: Trophy,
      title: 'Create Tournaments',
      description: 'Organize and manage esports tournaments with customizable settings and prize pools.',
      href: connected ? '/create' : '#',
      disabled: !connected,
    },
    {
      icon: Users,
      title: 'Join Tournaments',
      description: 'Browse and register for active tournaments across multiple games.',
      href: '/tournaments',
      disabled: false,
    },
    {
      icon: DollarSign,
      title: 'USDC Prizes',
      description: 'Compete for USDC prizes with secure on-chain prize distribution.',
      href: '/tournaments',
      disabled: false,
    },
    {
      icon: TrendingUp,
      title: 'Track Performance',
      description: 'Monitor tournament statistics and your gaming performance.',
      href: connected ? '/profile' : '#',
      disabled: !connected,
    },
  ]

  const stats = [
    { label: 'Total Tournaments', value: '150+', change: '+12%' },
    { label: 'Active Players', value: '2,500+', change: '+8%' },
    { label: 'Prize Pool', value: '$50,000+', change: '+25%' },
    { label: 'Games Supported', value: Object.keys(GAME_TYPE_LABELS).length, change: '0%' },
  ]

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6">
            Decentralized Esports
            <span className="text-primary-600">Tournaments</span>
          </h1>
          <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
            Create, join, and compete in blockchain-powered tournaments with secure USDC prizes 
            and transparent result management.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/tournaments"
              className="btn btn-primary btn-lg px-8 py-4"
            >
              <Play className="w-5 h-5 mr-2" />
              Browse Tournaments
            </Link>
            {connected && (
              <Link
                to="/create"
                className="btn btn-outline btn-lg px-8 py-4"
              >
                Create Tournament
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-secondary-900 mb-12">
            Platform Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-secondary-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-secondary-600 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-success-600 font-medium">
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-secondary-900 mb-12">
            Why Choose Espotz?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className={`
                    relative p-6 rounded-xl border-2 transition-all duration-300
                    ${feature.disabled
                      ? 'border-secondary-200 bg-secondary-50 opacity-60'
                      : 'border-secondary-300 bg-white hover:border-primary-400 hover:shadow-lg'
                    }
                  `}
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600 mb-4">
                    {feature.description}
                  </p>
                  {!feature.disabled ? (
                    <Link
                      to={feature.href}
                      className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Learn more
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <div className="text-sm text-secondary-500">
                      Connect wallet to access
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Supported Games */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-secondary-900 mb-12">
            Supported Games
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(GAME_TYPE_LABELS).map(([key, label]) => (
              <div
                key={key}
                className="bg-secondary-50 rounded-lg p-4 text-center hover:bg-secondary-100 transition-colors"
              >
                <div className="text-2xl mb-2">
                  {getGameEmoji(key)}
                </div>
                <div className="text-sm font-medium text-secondary-700">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!connected && (
        <section className="py-12 px-4 bg-primary-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Connect your wallet to start creating and joining tournaments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn bg-white text-primary-600 btn-lg hover:bg-primary-50">
                Connect Wallet
              </button>
              <Link
                to="/tournaments"
                className="btn btn-outline border-white text-white btn-lg hover:bg-white hover:text-primary-600"
              >
                Browse First
              </Link>
            </div>
          </div>
        </section>
      )}
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