import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-secondary-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎮</span>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-secondary-900 mb-4">
          404
        </h1>
        <h2 className="text-2xl text-secondary-600 mb-8">
          Page Not Found
        </h2>
        
        <p className="text-secondary-600 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Check the URL and try again, or return to the homepage.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn btn-primary"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
        
        {/* Quick Links */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Quick Links
          </h3>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <Link
              to="/tournaments"
              className="flex items-center p-4 bg-white rounded-lg border border-secondary-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-left">
                <div className="font-medium text-secondary-900">Browse Tournaments</div>
                <div className="text-sm text-secondary-600">View and join active tournaments</div>
              </div>
            </Link>
            
            <Link
              to="/create"
              className="flex items-center p-4 bg-white rounded-lg border border-secondary-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">➕</div>
              <div className="text-left">
                <div className="font-medium text-secondary-900">Create Tournament</div>
                <div className="text-sm text-secondary-600">Start your own tournament</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}