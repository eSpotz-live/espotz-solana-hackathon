#!/bin/bash

echo "=========================================="
echo "Espotz Solana Development Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Solana CLI is installed
echo -e "${YELLOW}[1/3] Installing Solana CLI...${NC}"
if command -v solana &> /dev/null; then
    echo -e "${GREEN}✓ Solana CLI already installed: $(solana --version)${NC}"
else
    sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo -e "${GREEN}✓ Solana CLI installed${NC}"
fi

# Configure Solana for devnet
echo -e "${YELLOW}[2/3] Configuring Solana for devnet...${NC}"
solana config set --url devnet
echo -e "${GREEN}✓ Solana configured for devnet${NC}"

# Check if Anchor is installed
echo -e "${YELLOW}[3/3] Installing Anchor...${NC}"
if command -v anchor &> /dev/null; then
    echo -e "${GREEN}✓ Anchor already installed: $(anchor --version)${NC}"
else
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
    echo -e "${GREEN}✓ Anchor installed${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Generate a new Solana wallet:"
echo "   solana-keygen new --outfile ~/.config/solana/id.json"
echo ""
echo "2. Get some devnet SOL:"
echo "   solana airdrop 5"
echo ""
echo "3. Initialize the Anchor project (already done if continuing)"
echo ""
