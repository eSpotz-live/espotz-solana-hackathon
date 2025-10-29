import { PublicKey } from '@solana/web3.js';

// Program ID on Solana Devnet
export const PROGRAM_ID = new PublicKey('BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv');

// RPC endpoint
export const RPC_ENDPOINT = 'https://api.devnet.solana.com';

// Instruction discriminators (extracted from IDL)
export const DISCRIMINATORS = {
  createTournament: Buffer.from([158, 137, 233, 231, 73, 132, 191, 68]),
  registerPlayer: Buffer.from([242, 146, 194, 234, 234, 145, 228, 42]),
  startTournament: Buffer.from([164, 168, 208, 157, 43, 10, 220, 241]),
  submitResults: Buffer.from([22, 16, 250, 159, 91, 235, 19, 57]),
  distributePrizes: Buffer.from([154, 99, 201, 93, 82, 104, 73, 232]),
};

// Game types
export const GAME_TYPES = {
  Chess: 0,
  Checkers: 1,
  Go: 2,
};

// Tournament status
export const TOURNAMENT_STATUS = {
  Open: 'Open',
  Active: 'Active',
  Ended: 'Ended',
  Completed: 'Completed',
};

// Solana Explorer base URL
export const EXPLORER_URL = 'https://explorer.solana.com';
