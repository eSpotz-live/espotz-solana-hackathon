#!/bin/bash

# Check if Solana CLI is already installed
if command -v solana &> /dev/null
then
    echo "Solana CLI is already installed."
else
    echo "Installing Solana CLI..."
    curl --proto '=https' --tlsv1.2 -sSfL https://release.solana.com/stable/install | sh
    echo "Solana CLI installed successfully."
fi

# Check if Anchor is already installed
if command -v anchor &> /dev/null
then
    echo "Anchor is already installed."
else
    echo "Installing Anchor..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
    echo "Anchor installed successfully."
    echo "Please run 'source ~/.profile' to update your PATH"
    echo "Verifying installation..."
    solana --version
    anchor --version
fi

echo "Dependencies check complete."