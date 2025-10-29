/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_ENDPOINT: string
  readonly VITE_NETWORK: string
  readonly VITE_USDC_MINT_DEVNET: string
  readonly VITE_USDC_MINT_MAINNET: string
  readonly VITE_PROGRAM_ID: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_HELIUS_RPC_ENDPOINT?: string
  readonly VITE_QUICKNODE_RPC_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}