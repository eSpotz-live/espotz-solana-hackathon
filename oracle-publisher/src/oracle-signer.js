import * as web3 from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as anchor from '@coral-xyz/anchor';

/**
 * Oracle Signer - Signs tournament results using Ed25519
 * This creates the Ed25519 signature that the smart contract will verify
 */
export class OracleSigner {
  constructor(secretKey) {
    // secretKey should be a Uint8Array(64) for Ed25519
    if (typeof secretKey === 'string') {
      // If it's a base58 string, decode it
      this.keypair = nacl.sign.keyPair.fromSecretKey(bs58.decode(secretKey));
    } else {
      this.keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
    }

    this.publicKey = new web3.PublicKey(this.keypair.publicKey);
  }

  /**
   * Sign tournament result data
   * @param {Object} result - Tournament result data
   * @param {PublicKey} result.tournament - Tournament pubkey
   * @param {number} result.timestamp - Unix timestamp
   * @param {PublicKey[]} result.winners - Array of winner pubkeys
   * @param {number[]} result.amounts - Array of prize amounts in lamports
   * @returns {Uint8Array} - Ed25519 signature
   */
  signTournamentResult(result) {
    // Create message buffer following smart contract's expected format:
    // tournament_key (32 bytes) + timestamp (8 bytes) + num_winners (1 byte) +
    // winner_pubkeys (32 * N bytes) + amounts (8 * N bytes)

    const buffers = [];

    // 1. Tournament pubkey (32 bytes)
    buffers.push(result.tournament.toBuffer());

    // 2. Timestamp (8 bytes, little-endian i64)
    const timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeBigInt64LE(BigInt(result.timestamp));
    buffers.push(timestampBuffer);

    // 3. Number of winners (1 byte)
    const numWinnersBuffer = Buffer.alloc(1);
    numWinnersBuffer.writeUInt8(result.winners.length);
    buffers.push(numWinnersBuffer);

    // 4. Winner pubkeys (32 bytes each)
    result.winners.forEach(winner => {
      buffers.push(winner.toBuffer());
    });

    // 5. Prize amounts (8 bytes each, little-endian u64)
    result.amounts.forEach(amount => {
      const amountBuffer = Buffer.alloc(8);
      amountBuffer.writeBigUInt64LE(BigInt(amount));
      buffers.push(amountBuffer);
    });

    // Concatenate all buffers
    const message = Buffer.concat(buffers);

    // Sign the message using Ed25519
    const signature = nacl.sign.detached(message, this.keypair.secretKey);

    return {
      signature: signature,
      message: message,
      publicKey: this.publicKey
    };
  }

  /**
   * Create Ed25519 instruction for on-chain signature verification
   * This instruction must be included BEFORE the distribute_prizes_oracle instruction
   */
  createEd25519Instruction(signature, message, publicKey) {
    const numSignatures = 1;
    const publicKeyOffset = 16; // After header
    const signatureOffset = publicKeyOffset + 32; // After pubkey
    const messageDataOffset = signatureOffset + 64; // After signature
    const messageDataSize = message.length;

    // Build Ed25519 instruction data
    const dataLayout = Buffer.alloc(
      16 + // Header
      32 + // Public key
      64 + // Signature
      message.length // Message
    );

    let offset = 0;

    // Header
    dataLayout.writeUInt8(numSignatures, offset);
    offset += 1;
    dataLayout.writeUInt8(0, offset); // padding
    offset += 1;
    dataLayout.writeUInt16LE(signatureOffset, offset);
    offset += 2;
    dataLayout.writeUInt16LE(0, offset); // signature_instruction_index
    offset += 2;
    dataLayout.writeUInt16LE(publicKeyOffset, offset);
    offset += 2;
    dataLayout.writeUInt16LE(0, offset); // pubkey_instruction_index
    offset += 2;
    dataLayout.writeUInt16LE(messageDataOffset, offset);
    offset += 2;
    dataLayout.writeUInt16LE(messageDataSize, offset);
    offset += 2;
    dataLayout.writeUInt16LE(0, offset); // message_instruction_index
    offset += 2;

    // Public key
    Buffer.from(publicKey.toBytes()).copy(dataLayout, offset);
    offset += 32;

    // Signature
    Buffer.from(signature).copy(dataLayout, offset);
    offset += 64;

    // Message
    message.copy(dataLayout, offset);

    // Create the instruction
    return new web3.TransactionInstruction({
      keys: [],
      programId: new web3.PublicKey('Ed25519SigVerify111111111111111111111111111'),
      data: dataLayout,
    });
  }

  /**
   * Generate a new oracle keypair and save it
   */
  static generateKeypair() {
    const keypair = web3.Keypair.generate();
    const secretKey = bs58.encode(keypair.secretKey);

    console.log('Generated Oracle Keypair:');
    console.log('Public Key:', keypair.publicKey.toString());
    console.log('Secret Key (base58):', secretKey);
    console.log('\nSave the secret key securely! Add it to your .env file:');
    console.log(`ORACLE_SECRET_KEY=${secretKey}`);

    return {
      publicKey: keypair.publicKey,
      secretKey: secretKey
    };
  }
}

// If run directly, generate a new keypair
if (import.meta.url === `file://${process.argv[1]}`) {
  OracleSigner.generateKeypair();
}
