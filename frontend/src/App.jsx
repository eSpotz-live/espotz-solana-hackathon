import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GAME_TYPES, TOURNAMENT_STATUS, RPC_ENDPOINT, EXPLORER_URL } from './utils/constants';
import { deriveTournamentPda } from './utils/pdas';
import { createTournament, registerPlayer, startTournament, submitResults, distributePrizes } from './utils/tournament';
import { initializeOracle, checkOracleInitialized, getOracleAccountData } from './utils/oracle';

const connection = new Connection(RPC_ENDPOINT, 'confirmed');

// Map game types to images
const GAME_IMAGES = {
  0: '/LOL.png', // League of Legends
  1: '/COD2.png', // Call of Duty Mobile
  2: '/pubg.png', // PUBG Mobile
  3: '/FF.png', // Free Fire
  4: '/fortnite.png', // Fortnite
  5: '/valo2.png', // Valorant
  6: '/CS.png', // CS:GO
  7: '/Dota.png', // Dota 2
};

function App() {
  const wallet = useWallet();
  const [tournaments, setTournaments] = useState(() => {
    // Load tournaments from localStorage on mount
    const saved = localStorage.getItem('espotz_tournaments');
    if (!saved) return [];

    // Migrate old 'Open' status to 'Registration'
    const parsed = JSON.parse(saved);
    return parsed.map(t => ({
      ...t,
      status: t.status === 'Open' ? TOURNAMENT_STATUS.Registration : t.status
    }));
  });
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [error, setError] = useState(null);

  // Filter and Search State
  const [activeFilter, setActiveFilter] = useState('All'); // All, Upcoming, Live, Completed
  const [searchQuery, setSearchQuery] = useState('');

  // Create Tournament Form State
  const [tournamentId, setTournamentId] = useState('');
  const [gameType, setGameType] = useState(0);
  const [entryFee, setEntryFee] = useState('0.0003');
  const [maxPlayers, setMaxPlayers] = useState('5');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Results submission state - map tournament ID to winner address
  const [winnerAddresses, setWinnerAddresses] = useState({});

  // Oracle status state - map tournament ID to oracle status
  const [oracleStatus, setOracleStatus] = useState({});

  // Save tournaments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('espotz_tournaments', JSON.stringify(tournaments));
  }, [tournaments]);

  // Generate random tournament ID
  const generateTournamentId = () => {
    setTournamentId(Math.floor(Math.random() * 1000000).toString());
  };

  // Clear all tournaments from localStorage
  const clearAllTournaments = () => {
    if (confirm('Are you sure you want to clear all tournaments? This will remove them from the UI but not from the blockchain.')) {
      setTournaments([]);
      localStorage.removeItem('espotz_tournaments');
      setTxStatus({ type: 'success', message: 'All tournaments cleared from local storage' });
    }
  };

  // Filter tournaments based on status and search query
  const getFilteredTournaments = () => {
    let filtered = tournaments;

    // Apply status filter
    if (activeFilter === 'Upcoming') {
      filtered = filtered.filter(t => t.status === TOURNAMENT_STATUS.Registration);
    } else if (activeFilter === 'Live') {
      filtered = filtered.filter(t => t.status === TOURNAMENT_STATUS.Active);
    } else if (activeFilter === 'Completed') {
      filtered = filtered.filter(t => t.status === TOURNAMENT_STATUS.Completed);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const gameName = Object.keys(GAME_TYPES).find(key => GAME_TYPES[key] === t.gameType)?.toLowerCase() || '';
        return (
          gameName.includes(query) ||
          t.id.toString().includes(query)
        );
      });
    }

    return filtered;
  };

  // Handle create tournament
  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!wallet.connected) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setTxStatus(null);

    try {
      const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

      const { txSig, tournamentPda } = await createTournament(
        wallet,
        parseInt(tournamentId),
        gameType,
        parseFloat(entryFee),
        parseInt(maxPlayers),
        startTimestamp,
        endTimestamp
      );

      setTxStatus({
        type: 'success',
        message: 'Tournament created successfully!',
        txSig,
      });

      // Add to tournaments list
      setTournaments([...tournaments, {
        id: parseInt(tournamentId),
        pda: tournamentPda.toString(),
        gameType,
        entryFee: parseFloat(entryFee),
        maxPlayers: parseInt(maxPlayers),
        currentPlayers: 0,
        participants: [],
        status: TOURNAMENT_STATUS.Registration,
        admin: wallet.publicKey.toString(),
        startTime: startTimestamp,
        endTime: endTimestamp,
      }]);

      // Reset form
      setTournamentId('');
      setGameType(0);
      setEntryFee('0.0003');
      setMaxPlayers('5');
      setStartTime('');
      setEndTime('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle register player
  const handleRegister = async (tournament) => {
    if (!wallet.connected) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setTxStatus(null);

    try {
      const tournamentPda = new PublicKey(tournament.pda);
      const txSig = await registerPlayer(wallet, tournamentPda);

      setTxStatus({
        type: 'success',
        message: 'Registered successfully!',
        txSig,
      });

      // Update tournament player count and add participant
      setTournaments(tournaments.map(t =>
        t.id === tournament.id
          ? {
              ...t,
              currentPlayers: t.currentPlayers + 1,
              participants: [...(t.participants || []), wallet.publicKey.toString()]
            }
          : t
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle start tournament
  const handleStart = async (tournament) => {
    if (!wallet.connected) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setTxStatus(null);

    try {
      const tournamentPda = new PublicKey(tournament.pda);
      const txSig = await startTournament(wallet, tournamentPda);

      setTxStatus({
        type: 'success',
        message: 'Tournament started!',
        txSig,
      });

      // Update tournament status
      setTournaments(tournaments.map(t =>
        t.id === tournament.id
          ? { ...t, status: TOURNAMENT_STATUS.Active }
          : t
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle submit results
  const handleSubmitResults = async (tournament) => {
    if (!wallet.connected) {
      setError('Please connect your wallet');
      return;
    }

    const winnerAddress = winnerAddresses[tournament.id];
    if (!winnerAddress) {
      setError('Please enter winner address');
      return;
    }

    setLoading(true);
    setError(null);
    setTxStatus(null);

    try {
      const tournamentPda = new PublicKey(tournament.pda);
      const winnerPubkey = new PublicKey(winnerAddress);
      const txSig = await submitResults(wallet, tournamentPda, [winnerPubkey]);

      setTxStatus({
        type: 'success',
        message: 'Results submitted!',
        txSig,
      });

      // Update tournament status
      setTournaments(tournaments.map(t =>
        t.id === tournament.id
          ? { ...t, status: TOURNAMENT_STATUS.Ended, winners: [winnerAddress] }
          : t
      ));

      // Clear winner address for this tournament
      setWinnerAddresses(prev => {
        const updated = { ...prev };
        delete updated[tournament.id];
        return updated;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle distribute prizes
  const handleDistributePrizes = async (tournament) => {
    if (!wallet.connected) {
      setError('Please connect your wallet');
      return;
    }

    if (!tournament.winners || tournament.winners.length === 0) {
      setError('No winners recorded');
      return;
    }

    setLoading(true);
    setError(null);
    setTxStatus(null);

    try {
      const tournamentPda = new PublicKey(tournament.pda);
      const winners = tournament.winners.map(w => new PublicKey(w));
      const totalPrize = tournament.currentPlayers * tournament.entryFee * LAMPORTS_PER_SOL;
      const amounts = [totalPrize]; // Give all to first winner for simplicity

      const txSig = await distributePrizes(wallet, tournamentPda, winners, amounts);

      setTxStatus({
        type: 'success',
        message: 'Prizes distributed!',
        txSig,
      });

      // Update tournament status
      setTournaments(tournaments.map(t =>
        t.id === tournament.id
          ? { ...t, status: TOURNAMENT_STATUS.Completed }
          : t
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle initialize oracle
  const handleInitializeOracle = async (tournament) => {
    if (!wallet.connected) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setTxStatus(null);

    try {
      const tournamentPda = new PublicKey(tournament.pda);
      const { txSig, tournamentOraclePda } = await initializeOracle(wallet, tournamentPda);

      setTxStatus({
        type: 'success',
        message: 'Oracle initialized successfully!',
        txSig,
      });

      // Update oracle status for this tournament
      setOracleStatus(prev => ({
        ...prev,
        [tournament.id]: { initialized: true, pda: tournamentOraclePda.toString() }
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check oracle status for a tournament
  const checkTournamentOracle = async (tournament) => {
    try {
      const tournamentPda = new PublicKey(tournament.pda);
      const status = await checkOracleInitialized(tournamentPda);

      setOracleStatus(prev => ({
        ...prev,
        [tournament.id]: status
      }));
    } catch (err) {
      console.error('Error checking oracle status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation Header */}
      <nav className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <img src="/espotz-logo.png" alt="Espotz" className="h-8" />
              <div className="hidden md:flex space-x-6">
                <button className="text-gray-300 hover:text-white transition">Tournaments</button>
                <button className="text-gray-300 hover:text-white transition">Stake</button>
                <button className="text-gray-300 hover:text-white transition">Leaderboard</button>
              </div>
            </div>
            <WalletMultiButton />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Transaction Status */}
        {txStatus && (
          <div className="mb-6 p-4 bg-green-500 bg-opacity-20 backdrop-blur-sm border border-green-400 rounded-lg">
            <p className="text-green-100 font-semibold">{txStatus.message}</p>
            <a
              href={`${EXPLORER_URL}/tx/${txStatus.txSig}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 underline text-sm"
            >
              View on Explorer
            </a>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 backdrop-blur-sm border border-red-400 rounded-lg">
            <p className="text-red-100">{error}</p>
          </div>
        )}

        {/* Create Tournament Form */}
        <div className="mb-8 p-6 bg-gray-900 rounded-xl border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-4">Create Tournament</h2>
          <form onSubmit={handleCreateTournament} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Tournament ID</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={tournamentId}
                    onChange={(e) => setTournamentId(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30"
                    placeholder="Enter ID"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateTournamentId}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Random
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white mb-2">Game Type</label>
                <select
                  value={gameType}
                  onChange={(e) => setGameType(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white border border-white border-opacity-30"
                  style={{ color: 'white' }}
                >
                  {Object.entries(GAME_TYPES).map(([name, value]) => (
                    <option key={value} value={value} style={{ backgroundColor: '#1a1a2e', color: 'white' }}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white mb-2">Entry Fee (SOL)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2">Max Players</label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white border border-white border-opacity-30"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white border border-white border-opacity-30"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !wallet.connected}
              className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
          </form>
        </div>

        {/* Tournaments List */}
        <div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-3xl font-bold text-white">All Tournaments</h2>
              {tournaments.length > 0 && (
                <button
                  onClick={clearAllTournaments}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-4">{getFilteredTournaments().length} tournaments found</p>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3 mb-4">
              {['All', 'Upcoming', 'Live', 'Completed'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                    activeFilter === filter
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tournaments..."
                className="w-full px-4 py-3 pl-12 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {getFilteredTournaments().length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-white text-xl font-semibold mb-2">No tournaments found</p>
              <p className="text-gray-400">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredTournaments().map((tournament) => {
                const gameName = Object.keys(GAME_TYPES).find(key => GAME_TYPES[key] === tournament.gameType);
                const gameImage = GAME_IMAGES[tournament.gameType];

                return (
                <div
                  key={tournament.id}
                  className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-purple-500 transition-colors"
                >
                  {/* Game Hero Image */}
                  {gameImage ? (
                    <div className="relative h-48 bg-gradient-to-b from-purple-900/50 to-gray-900 overflow-hidden">
                      <img
                        src={gameImage}
                        alt={gameName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                      <div className="absolute bottom-3 left-3">
                        <span className="px-3 py-1 bg-purple-600 text-white text-sm font-semibold rounded-full">
                          {gameName}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          tournament.status === TOURNAMENT_STATUS.Registration ? 'bg-green-500' :
                          tournament.status === TOURNAMENT_STATUS.Active ? 'bg-yellow-500' :
                          tournament.status === TOURNAMENT_STATUS.Ended ? 'bg-orange-500' :
                          'bg-blue-500'
                        } text-white`}>
                          {tournament.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-48 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h3 className="text-3xl font-bold text-white">{gameName}</h3>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          tournament.status === TOURNAMENT_STATUS.Registration ? 'bg-green-500' :
                          tournament.status === TOURNAMENT_STATUS.Active ? 'bg-yellow-500' :
                          tournament.status === TOURNAMENT_STATUS.Ended ? 'bg-orange-500' :
                          'bg-blue-500'
                        } text-white`}>
                          {tournament.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Tournament Info */}
                  <div className="p-5">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-1">Tournament #{tournament.id}</h3>
                      <p className="text-gray-400 text-sm">{gameName}</p>
                    </div>

                  <div className="space-y-2 mb-4 text-white text-sm">
                    <p><span className="text-gray-400">Entry Fee:</span> {tournament.entryFee} SOL</p>
                    <p><span className="text-gray-400">Players:</span> {tournament.currentPlayers} / {tournament.maxPlayers}</p>
                    <p><span className="text-gray-400">Start:</span> {new Date(tournament.startTime * 1000).toLocaleString()}</p>
                    <p><span className="text-gray-400">End:</span> {new Date(tournament.endTime * 1000).toLocaleString()}</p>

                    {/* Oracle Status */}
                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-gray-400 mb-1">Oracle Status:</p>
                      <div className="flex items-center gap-2">
                        {oracleStatus[tournament.id]?.initialized ? (
                          <span className="text-green-400 text-xs flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Initialized
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Not Initialized
                          </span>
                        )}
                        {!oracleStatus[tournament.id] && (
                          <button
                            onClick={() => checkTournamentOracle(tournament)}
                            className="text-xs text-purple-400 hover:text-purple-300 underline"
                          >
                            Check
                          </button>
                        )}
                      </div>
                    </div>

                    {tournament.participants && tournament.participants.length > 0 && (
                      <div>
                        <p className="text-gray-400 mb-1">Participants:</p>
                        <div className="text-xs space-y-1">
                          {tournament.participants.map((participant, idx) => (
                            <p key={idx} className="truncate font-mono">{participant}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions based on status */}
                  <div className="space-y-2">
                    {tournament.status === TOURNAMENT_STATUS.Registration && (
                      <>
                        <button
                          onClick={() => handleRegister(tournament)}
                          disabled={loading}
                          className="w-full py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                          Register
                        </button>
                        {wallet.publicKey && tournament.admin === wallet.publicKey.toString() && (
                          <>
                            {!oracleStatus[tournament.id]?.initialized && (
                              <button
                                onClick={() => handleInitializeOracle(tournament)}
                                disabled={loading}
                                className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                              >
                                Initialize Oracle
                              </button>
                            )}
                            <button
                              onClick={() => handleStart(tournament)}
                              disabled={loading}
                              className="w-full py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                            >
                              Start Tournament
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {tournament.status === TOURNAMENT_STATUS.Active &&
                     wallet.publicKey &&
                     tournament.admin === wallet.publicKey.toString() && (
                      <div className="space-y-2">
                        {Date.now() >= tournament.endTime * 1000 ? (
                          <>
                            <input
                              type="text"
                              value={winnerAddresses[tournament.id] || ''}
                              onChange={(e) => setWinnerAddresses(prev => ({ ...prev, [tournament.id]: e.target.value }))}
                              placeholder="Winner's wallet address"
                              className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-gray-300 border border-white border-opacity-30"
                            />
                            <button
                              onClick={() => handleSubmitResults(tournament)}
                              disabled={loading}
                              className="w-full py-2.5 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                            >
                              Submit Results
                            </button>
                          </>
                        ) : (
                          <div className="py-2 bg-yellow-500 bg-opacity-30 text-center rounded-lg text-white text-sm">
                            Tournament must end before submitting results
                            <br />
                            <span className="text-xs">Ends: {new Date(tournament.endTime * 1000).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {tournament.status === TOURNAMENT_STATUS.Ended &&
                     wallet.publicKey &&
                     tournament.admin === wallet.publicKey.toString() && (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleDistributePrizes(tournament)}
                          disabled={loading}
                          className="w-full py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                          Distribute Prizes (Manual)
                        </button>
                        {oracleStatus[tournament.id]?.initialized && (
                          <div className="p-3 bg-indigo-500 bg-opacity-20 border border-indigo-400 rounded-lg">
                            <p className="text-indigo-200 text-xs">
                              <span className="font-semibold">Oracle Enabled:</span> Prize distribution with oracle verification must be done through the oracle publisher service.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {tournament.status === TOURNAMENT_STATUS.Completed && (
                      <div className="py-2 bg-green-500 bg-opacity-30 text-center rounded-lg text-white font-semibold">
                        Prizes Distributed
                      </div>
                    )}
                  </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
