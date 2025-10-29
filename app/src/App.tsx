import { Routes, Route, Navigate } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'

import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import TournamentsPage from '@/pages/TournamentsPage'
import TournamentDetailPage from '@/pages/TournamentDetailPage'
import CreateTournamentPage from '@/pages/CreateTournamentPage'
import AdminPage from '@/pages/AdminPage'
import ProfilePage from '@/pages/ProfilePage'
import NotFoundPage from '@/pages/NotFoundPage'

function App() {
  const { connected } = useWallet()

  return (
    <div className="min-h-screen bg-secondary-50">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/tournaments" element={<Layout><TournamentsPage /></Layout>} />
        <Route path="/tournaments/:id" element={<Layout><TournamentDetailPage /></Layout>} />
        
        {/* Protected routes */}
        <Route 
          path="/create" 
          element={
            connected ? 
              <Layout><CreateTournamentPage /></Layout> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/admin" 
          element={
            connected ? 
              <Layout><AdminPage /></Layout> : 
              <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/profile" 
          element={
            connected ? 
              <Layout><ProfilePage /></Layout> : 
              <Navigate to="/" replace />
          } 
        />
        
        {/* 404 */}
        <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
      </Routes>
    </div>
  )
}

export default App