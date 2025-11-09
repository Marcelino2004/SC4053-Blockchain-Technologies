hii testing

To update submodules:

```
git pull --recurse-submodules
```

# DEXChange

## Project Overview

**DEXChange** is a decentralized exchange (DEX) built on the Ethereum blockchain that allows users to list, buy, and sell digital assets in a decentralized manner. Unlike traditional centralized exchanges, DEXChange gives users complete control over their assets by leveraging blockchain technology and smart contracts. Users can connect their wallets (such as MetaMask) to trade tokens directly from their wallets, without relying on a centralized intermediary.

Our DEX combines an Automated Market Maker (AMM) for instant market trades and an off-chain order matching system implemented in Go for handling limit and stop orders. This hybrid approach enhances flexibility and scalability while keeping gas costs efficient.

## Features

- **Wallet Integration**: Connect MetaMask to interact with the DEX.
- **Token Creation**: Issue new tokens using the ERC20 standard.
- **Order Types**:
  - **Market Orders**: Instantly trade at the current market price using an AMM.
  - **Limit Orders**: Execute trades only when the market price meets the specified conditions.
  - **Stop Orders**: Execute trades when the price reaches a certain trigger, processed off-chain until the conditions are met.
- **Batch Order Processing**: Process multiple open orders in batch, using a directed graph to identify cycles and maximize trading volume.
- **Partial Order Execution**: Allows partial fulfillment of orders if only part of the required trade is available.
- **Order Cancellation**: Users can cancel open orders if they change their mind.

## Tech Stack

- **Smart Contracts**: Written in Solidity to handle token issuance and basic AMM operations.
- **Backend**: Go, to handle off-chain order matching, batch processing, and API calls.
- **Frontend**: Next.js, for a responsive and interactive DApp user interface.
- **Blockchain Development**: Hardhat, for local Ethereum testnet deployment and testing.

## Prerequisites

To run this project, ensure you have the following installed:

- **Node.js**: v14.x or later
- **Go**: v1.16 or later
- **Hardhat**: `npm install --save-dev hardhat`
- **MetaMask**: Install the MetaMask browser extension for connecting with the DEX.

## Metamask Wallet on Local Network

To use MetaMask on a local network, you need to add a custom network with the following settings:

- **Network Name**: Localhost
- **New RPC URL**: http://localhost:8545
- **Chain ID**: 1337

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/DEXChange.git
git submodule update --init --recursive
cd DEXChange
```

### 2. Install Dependencies

- **Frontend (Next.js)**:

  ```bash
  cd sc4053-frontend
  npm install
  ```

- **Backend (Go)**:

  ```bash
  cd go-orderbook
  go mod tidy
  ```

### 3. Compile and Deploy Smart Contracts

- Go to the `blkchain-orderbook` directory, install Hardhat if necessary, and compile the Solidity smart contracts:

  ```bash
  cd blkchain-orderbook
  npm install
  npx hardhat compile
  ```

- Deploy the contracts to a local Ethereum testnet using Hardhat:

  ```bash
  npx hardhat node
  npx hardhat run scripts/deploy.js --network localhost
  ```

  This will deploy the contracts to a local testnet and provide contract addresses for configuration.

### 4. Configure Environment Variables

Create `.env` files for both the frontend and backend with the necessary environment variables.

- **Backend (`go-orderbook/.env`)**:

  ```env
  INFURA_API_URL=<Your Infura Project URL>
  PRIVATE_KEY=<Your Private Key for Deployment>
  CONTRACT_ADDRESS=<Deployed Smart Contract Address>
  ```

- **Frontend (`sc4053-frontend/.env.local`)**:

  ```env
  NEXT_PUBLIC_APP_URL=<Your application URL>
  NEXT_PUBLIC_WEB3_PROVIDER_URL=<Default RPC URL>
  ```

### 5. Start the Backend (Go)

Navigate to the backend directory and start the Go server:

```bash
cd go-orderbook
go run main.go
```

The backend will handle off-chain order matching and provide API endpoints for the frontend.

### 6. Start the Frontend (Next.js)

Navigate to the frontend directory and run the development server:

```bash
cd sc4053-frontend
npm run dev
```

The frontend should be running on `http://localhost:3000`.

## Usage

1. **Connect MetaMask**: Open the DApp in your browser and connect your MetaMask wallet.
2. **Create Tokens**: Use the "Create Token" feature to issue new ERC20 tokens.
3. **Place Orders**:
   - **Market Order**: Execute trades instantly based on the current market price using the AMM.
   - **Limit/Stop Order**: Specify the price or trigger point, and the backend will manage off-chain order matching.
4. **Batch Processing**: Watch as the backend processes orders in batches when cycles are detected, maximizing trade execution.
5. **Cancel Orders**: If needed, cancel open orders directly from the order book.

## Project Structure

- **blkchain-orderbook/** - Solidity smart contracts and deployment scripts.
- **sc4053-frontend/** - Next.js application for the DApp frontend.
- **go-orderbook** - Go application for off-chain order matching and batch processing.

## Testing

- **Smart Contracts**: Use Hardhat to test the Solidity smart contracts.

  ```bash
  cd blkchain-orderbook
  npx hardhat test
  ```

- **Backend**: Implement unit tests for the Go backend to test order matching and batch processing logic.

  ```bash
  cd go-orderbook
  go test ./...
  ```

- **Frontend**: Use Jest and React Testing Library for testing the frontend components.

  ```bash
  cd sc4053-frontend
  npm run test
  ```

## Future Improvements

1. **Enhanced Order Types**: Support for more complex order types like conditional orders.
2. **Gas Optimization**: Further optimize Solidity code to reduce gas fees.
3. **Cross-chain Compatibility**: Extend DEX capabilities to support other blockchains.
4. **Improved UI**: Enhance the frontend with better visuals and user experience for ease of use.

## Acknowledgments

- [Solidity](https://docs.soliditylang.org/) - Smart contract programming language.
- [Next.js](https://nextjs.org/) - React framework for the frontend.
- [Go](https://golang.org/) - Backend language for off-chain processing.
- [Hardhat](https://hardhat.org/) - Ethereum development environment.
- [MetaMask](https://metamask.io/) - Ethereum wallet for interacting with DApps.

## Common Issue

### Reset Local Network

After resetting local network, the block number stored in Metamask Wallet is not synchronized. To fix this issue, follow the steps below:

1. Open Metamask Wallet and click settings
2. Click Advanced
3. Clear Activity Tab Data
4. Reset Browser

## License

This project is licensed under the MIT License.

---
