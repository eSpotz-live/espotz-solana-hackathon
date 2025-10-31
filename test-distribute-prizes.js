const { Connection, PublicKey, Transaction, TransactionInstruction, SystemProgram } = require('@solana/web3.js');
const { Buffer } = require('buffer');
const BN = require('bn.js');

const PROGRAM_ID = new PublicKey('BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv');
const RPC_ENDPOINT = 'https://api.devnet.solana.com';
const DISCRIMINATOR = Buffer.from([154, 99, 201, 93, 82, 104, 73, 232]);

// Tournament from the UI
const tournamentId = '802329';

// Derive PDAs
function deriveTournamentPda(tournamentId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('tournament'), Buffer.from(tournamentId)],
    PROGRAM_ID
  );
  return pda;
}

function deriveVaultAuthorityPda(tournamentPda) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault-authority'), tournamentPda.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

function deriveVaultAccountPda(tournamentPda) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault-token'), tournamentPda.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

async function testDistributePrizes() {
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');

  const tournamentPda = deriveTournamentPda(tournamentId);
  const vaultAuthorityPda = deriveVaultAuthorityPda(tournamentPda);
  const vaultAccountPda = deriveVaultAccountPda(tournamentPda);

  console.log('Tournament PDA:', tournamentPda.toBase58());
  console.log('Vault Authority PDA:', vaultAuthorityPda.toBase58());
  console.log('Vault Account PDA:', vaultAccountPda.toBase58());

  // Fetch tournament account
  try {
    const tournamentAccount = await connection.getAccountInfo(tournamentPda);
    if (!tournamentAccount) {
      console.error('❌ Tournament account not found!');
      return;
    }
    console.log('✅ Tournament account exists');
    console.log('Data length:', tournamentAccount.data.length);

    // Try to parse some data
    const data = tournamentAccount.data;
    console.log('First 100 bytes:', data.slice(0, 100).toString('hex'));

  } catch (err) {
    console.error('Error fetching tournament:', err);
  }

  // Check vault account
  try {
    const vaultAccount = await connection.getAccountInfo(vaultAccountPda);
    if (!vaultAccount) {
      console.error('❌ Vault account not found!');
      return;
    }
    console.log('✅ Vault account exists');
    console.log('Vault balance:', vaultAccount.lamports / 1e9, 'SOL');
  } catch (err) {
    console.error('Error fetching vault:', err);
  }

  // Test instruction data serialization
  const winners = [
    new PublicKey('Hfzn2aTtkZprPhWnTQYBcjH1GtDsb1EmcqcTJmRdnRKL')
  ];
  const totalPrize = 600000; // 0.0006 SOL (2 players * 0.0003)
  const amounts = [totalPrize];

  const data = Buffer.alloc(512);
  let offset = 0;

  // Discriminator
  DISCRIMINATOR.copy(data, offset);
  offset += 8;

  // Vec<Pubkey> winners - length (u32 LE)
  data.writeUInt32LE(winners.length, offset);
  offset += 4;

  // Write each winner pubkey
  for (const winner of winners) {
    winner.toBuffer().copy(data, offset);
    offset += 32;
  }

  // Vec<u64> amounts - length (u32 LE)
  data.writeUInt32LE(amounts.length, offset);
  offset += 4;

  // Write each amount (u64 LE)
  for (const amount of amounts) {
    new BN(amount).toArrayLike(Buffer, 'le', 8).copy(data, offset);
    offset += 8;
  }

  const instructionData = data.slice(0, offset);
  console.log('\nInstruction data:', instructionData.toString('hex'));
  console.log('Instruction data length:', instructionData.length);

  // Simulate transaction (without signing)
  const admin = new PublicKey('sp7k6Ge54Bc7BkgXwNh72BVyy98DM3Lndk5PzwzUsJ2Z'); // From browser

  const accounts = [
    { pubkey: tournamentPda, isSigner: false, isWritable: true },
    { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
    { pubkey: vaultAccountPda, isSigner: false, isWritable: true },
    { pubkey: admin, isSigner: true, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  // Add winner accounts
  for (const winner of winners) {
    accounts.push({ pubkey: winner, isSigner: false, isWritable: true });
  }

  console.log('\nAccounts:');
  accounts.forEach((acc, i) => {
    console.log(`  ${i}:`, acc.pubkey.toBase58(), `(signer: ${acc.isSigner}, writable: ${acc.isWritable})`);
  });

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: accounts,
    data: instructionData,
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = admin;
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;

  try {
    console.log('\n🧪 Simulating transaction...');
    const simulation = await connection.simulateTransaction(tx);

    if (simulation.value.err) {
      console.error('\n❌ Simulation failed!');
      console.error('Error:', JSON.stringify(simulation.value.err, null, 2));
    } else {
      console.log('\n✅ Simulation successful!');
    }

    if (simulation.value.logs) {
      console.log('\n📝 Program logs:');
      simulation.value.logs.forEach(log => console.log('  ', log));
    }

  } catch (err) {
    console.error('\n❌ Simulation error:', err.message);
  }
}

testDistributePrizes().catch(console.error);
