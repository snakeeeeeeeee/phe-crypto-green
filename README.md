# 🌱 CryptoGreen Privacy Guardian

A donation platform based on Zama FHEVM, using Fully Homomorphic Encryption (FHE) to protect donation privacy.

## ✨ Core Features

### 🔐 Fully Homomorphic Encryption (FHE)
- **Fully Encrypted Donations**: Uses Zama FHEVM technology to keep donation amounts encrypted throughout the entire process
- **Privacy Protection**: Even contract developers cannot see specific donation amounts
- **Secure Computation**: Supports calculations on encrypted data, such as comparing top donors

## 🏗️ Technical Architecture

### Smart Contracts
- Contracts based on Zama FHEVM

### Frontend Tech Stack
- **Next.js 15**: React framework
- **Wagmi**: Ethereum interaction
- **RainbowKit**: Wallet connection
- **fhevmjs**: FHE encryption client
- **Tailwind CSS**: Styling framework

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Clone the project
git clone <your-repo>
cd phe-climate-protection

# Install dependencies
npm install
```

### 2. Contract Deployment

```bash
# Modify contract configuration file
cp .env.example .env

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Sepolia testnet
npm run deploy:phe
```

### 3. Frontend Configuration
```bash
# Configuration is now in .env file
# Update .env with your contract address and network settings

# Start development server
npm run dev
```

## 📝 Environment Variables Configuration

Update `.env` file with your configuration:

```env
# Private key for deployment (keep secure)
PRIVATE_KEY=0x...

# Contract address (automatically generated after deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# Network configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=sepolia
NEXT_PUBLIC_NETWORK_URL=https://eth-sepolia.api.onfinality.io/public

# FHE configuration
NEXT_PUBLIC_USE_FHE=true
NEXT_PUBLIC_FHE_RELAYER_URL=https://relayer.testnet.zama.cloud

# Blockchain explorer
NEXT_PUBLIC_EXPLORER_URL=https://sepolia.etherscan.io

# App configuration
NEXT_PUBLIC_APP_MODE=PHE_ETH_ONLY
NEXT_PUBLIC_DONATION_TOKEN=ETH
```

## 🎮 Usage Flow

### 1. Create Project
Project creators can create climate protection projects, setting target amounts and deadlines.

### 2. Encrypted Donations
After users connect their wallet:
1. Select donation amount
2. System encrypts amount using FHE
3. Submit encrypted donation to contract
4. Complete donation while protecting privacy

### 3. View Statistics
- **Public Information**: Number of donors, project status
- **Private Information**: Specific donation amounts remain encrypted
- **Personal View**: Users can view their own encrypted donation records

### 4. Project Completion
- Project creators can withdraw funds
- Other donation amounts remain private

## 🔐 FHE Privacy Protection Explanation

### Encryption Process
1. **Client-side Encryption**: Users encrypt donation amounts in browser using fhevmjs
2. **Zero-Knowledge Proof**: Generate inputProof to prove validity of encrypted data
3. **On-chain Storage**: Contract only stores encrypted data, no plaintext exposure

### Privacy Levels
- ✅ **Donation Amounts**: Fully encrypted, no one can view
- 📊 **Statistical Information**: Non-sensitive info like donor count is public

## 🧪 Testing

```bash
# Run contract tests
npm run test

# Test on local network
npm run deploy:local
```

## 🛠️ Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build production version
npm run start        # Start production server

# Contracts
npm run compile      # Compile contracts
npm run test         # Run tests
npm run deploy:phe # Deploy contracts to testnet

# Tools
npm run lint         # Code linting
```

## 🔍 Troubleshooting

### Common Issues

1. **FHE Initialization Failed**
   - Check NEXT_PUBLIC_FHE_GATEWAY_URL configuration
   - Confirm network connection is normal

2. **Donation Transaction Failed**
   - Ensure wallet has enough ETH for gas fees
   - Check contract address configuration

3. **Encryption Failed**
   - Confirm fhevmjs dependencies are installed correctly
   - Check inputProof generation

## 📄 License

MIT License

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to improve the project!

---