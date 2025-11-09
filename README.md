# SC4053-Blockchain

## Overview
This project is a decentralized marketplace for exchanging digital assets on the Ethereum blockchain. Rather than relying on a central exchange to hold funds or approve trades, users interact directly through smart contracts, retaining full control of their tokens. By connecting a wallet like MetaMask, individuals can buy, sell, and swap assets directly from their own accounts.

The system uses a hybrid trading approach: an Automated Market Maker provides fast, on-chain swaps for immediate trades, while a separate off-chain order engine (implemented in Go) supports more advanced order types like limit and stop orders. This setup delivers a balance of convenience and control, enabling both quick transactions and precise order execution—without sacrificing decentralization or causing unnecessary gas costs.

## Tools used
- Solidity: Writing the smart contracts
- Go: Handling all the backend logic
- Nextjs: Creating the frontend visuals
- Hardhat: Framework for local testnet deployment

## Features Implemented
- Wallet Connection: Users can link a Web3 wallet (such as MetaMask) to interact directly with the exchange and manage their transactions without relinquishing control of their assets.
- Token Deployment: The platform supports creating new tokens that follow the ERC-20 standard, allowing anyone to launch and manage their own digital assets.
- Order Types:
  - Market Orders: Execute trades immediately at the best available price through the Automated Market Maker mechanism.
  - Limit Orders: Orders are carried out only when the market reaches the user’s chosen price.
  - Stop Orders: Orders activate only when a predefined threshold is hit; these are monitored off-chain until conditions are satisfied.
- Partial Order: Orders can be partially completed if only part of the requested trade volume is available at the moment, ensuring no opportunity goes to waste.
- Cancel Order: Open orders remain under the user’s control and can be withdrawn or canceled at any time before execution.

## Pre-requisites
Modules to be installed before running the project:
- Node.js: v14.x or later
- Go: v1.16 or later
- Hardhat: yarn install --save-dev hardhat or npm install --save-dev hardhat
- MetaMask: Install the MetaMask browser extension for connecting with the DEX.

## Custom Network for Metamask Set-up
- Network Name: Localhost
- New RPC URL: http://localhost:8545
- Chain ID: 1337

## Set-up Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/DEXChange.git
git submodule update --init --recursive
cd DEXChange
```

### 2. Install Dependencies
- Frontend (Next.js):
```bash
cd sc4053-frontend
yarn install
```

- Backend (Go):
```bash
cd go-orderbook
go mod tidy
```

### 3. Compile and Deploy Smart Contracts
- In the blkchain-orderbook directory, install Hardhat and compile the Solidity smart contracts:
```bash
cd blkchain-orderbook
yarn install
yarn hardhat compile
```

- Still in the blkchain-orderbook directory, deploy the contracts to a local Ethereum testnet using Hardhat:
```bash
yarn hardhat node
yarn hardhat run scripts/deploy.js --network localhost
```

- Add liquidity to the pool (to try and trade)
```bash
yarn hardhat run scripts/createLP --network localhost
```

4. Configure Environment Variables
- Create .env files for both the frontend and backend with the necessary environment variables.

For Backend (go-orderbook/.env):
```dotenv
INFURA_API_URL=<Your Infura Project URL>
PRIVATE_KEY=<Your Private Key for Deployment>
CONTRACT_ADDRESS=<Deployed Smart Contract Address>
```
For Frontend (sc4053-frontend/.env.local):
```dotenv
NEXT_PUBLIC_APP_URL=<Your application URL>
NEXT_PUBLIC_WEB3_PROVIDER_URL=<Default RPC URL>
```

5. Start the Backend (Go)
- Go to the backend directory and start the Go server:
```Go
cd ..  #If you are still in the blkchain-orderbook directory
cd go-orderbook
go run main.go
```

6. Start the Frontend (Next.js)
- Go to the frontend directory and run the development server:
```Javascript
cd sc4053-frontend
yarn run dev
```
The frontend will run on http://localhost:3000. Copy and paste this in the web browser to see and interact with the frontend.

