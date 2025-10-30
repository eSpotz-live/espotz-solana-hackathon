import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './constants';

export function deriveTournamentPda(tournamentId) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(tournamentId);

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('tournament'), buffer],
    PROGRAM_ID
  );

  return pda;
}

export function deriveVaultAuthorityPda(tournamentPda) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault-authority'), tournamentPda.toBuffer()],
    PROGRAM_ID
  );

  return pda;
}

export function deriveVaultAccountPda(tournamentPda) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault-token'), tournamentPda.toBuffer()],
    PROGRAM_ID
  );

  return pda;
}

export function derivePlayerEntryPda(tournamentPda, playerPubkey) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('player-entry'), tournamentPda.toBuffer(), playerPubkey.toBuffer()],
    PROGRAM_ID
  );

  return pda;
}
