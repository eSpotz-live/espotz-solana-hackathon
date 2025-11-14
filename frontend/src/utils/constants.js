import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';

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
  initializeOracle: Buffer.from([144, 223, 131, 120, 196, 253, 181, 99]),
  distributePrizesOracle: Buffer.from([46, 38, 87, 3, 200, 88, 21, 121]),
};

// Game types
export const GAME_TYPES = {
  'League of Legends': 0,
  'Call of Duty Mobile': 1,
  'PUBG Mobile': 2,
  'Free Fire': 3,
  'Fortnite': 4,
  'Valorant': 5,
  'CS:GO': 6,
  'Dota 2': 7,
};

// Tournament status (must match Rust enum)
export const TOURNAMENT_STATUS = {
  Registration: 'Registration',
  Active: 'Active',
  Ended: 'Ended',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
};

// Solana Explorer base URL
export const EXPLORER_URL = 'https://explorer.solana.com';
