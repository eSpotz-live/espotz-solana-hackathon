# Deployment Guide

## Run Locally (Development)

### Prerequisites
- Node.js 18+
- Phantom wallet browser extension
- Solana devnet SOL (free airdrop)

### Steps

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start dev server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   - Navigate to http://localhost:5173/
   - Click "Connecting..." to link Phantom wallet
   - Get free devnet SOL: https://faucet.solana.com/

4. **Test the app**
   - Create tournament
   - Register players
   - Start tournament
   - Submit results
   - Distribute prizes

## Deploy Smart Contract (Mainnet)

### Prerequisites
- Solana CLI installed
- Anchor installed
- Mainnet SOL (~5 SOL for deployment)

### Steps

1. **Configure for mainnet**
   ```bash
   solana config set --url mainnet-beta
   ```

2. **Build program**
   ```bash
   anchor build
   ```

3. **Deploy**
   ```bash
   anchor deploy
   ```

4. **Save Program ID**
   - Copy the program ID shown after deployment
   - Update frontend constants with new Program ID

5. **Update frontend**
   Edit `frontend/src/utils/constants.js`:
   ```javascript
   export const PROGRAM_ID = new PublicKey('YOUR_NEW_PROGRAM_ID');
   ```

6. **Deploy frontend**
   ```bash
   cd frontend
   npm run build
   # Deploy dist/ folder to hosting (Vercel, Netlify, etc.)
   ```

## Current Deployment Status

✅ **Smart Contract:** Deployed on Solana devnet
- Program ID: `BCp2s2ogskLUShw7Xvvkvbz2YWp9m94RPWJQCyXptyuv`

✅ **Frontend:** Running locally at `http://localhost:5173/`

## Hosting Options

- **Vercel:** `npm run build && vercel --prod`
- **Netlify:** `npm run build && netlify deploy --prod --dir=dist`
- **GitHub Pages:** `npm run build && gh-pages -d dist`
- **AWS S3:** `npm run build && aws s3 sync dist/ s3://your-bucket/`
