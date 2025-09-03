# iExec Confidential Computing - Deployment & Setup Guide

## Quick Start Overview

This guide provides step-by-step instructions for setting up and running the iExec confidential computing system, including both the scoring algorithm (TEE) and frontend interface.

## Prerequisites

### Required Software
- **Node.js**: v22+ (for both frontend and scoring algorithm)
- **npm**: Latest version
- **Docker**: For TEE containerization (optional for local dev)
- **iApp CLI**: iExec command-line tools
- **MetaMask**: Or compatible Web3 wallet

### Required Accounts & Keys
- **Crypto Wallet**: With some xRLC tokens for Bellecour network
- **Private Key**: For protected data operations
- **DockerHub Account**: For TEE deployment (if deploying)

## Part 1: Scoring Algorithm Setup

### 1.1 Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd iexec__/scoring-algorithm

# Install dependencies
npm install

# Install iApp CLI globally
npm install -g @iexec/iapp
```

### 1.2 Environment Configuration

Create `.env` file in `scoring-algorithm/` directory:

```bash
cp .env.example .env
```

**Edit `.env` file**:
```bash
# Your wallet private key (has xRLC tokens)
WALLET_PRIVATE_KEY=your_private_key_here

# iApp address (already deployed)
IAPP_ADDRESS=0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d

# Protected data address (will be created)
PROTECTED_DATA_ADDRESS=0x1016cebd9CDFe9f4dF90e02ee5F9f319D82C1B4B

# Authorized user address (your wallet address)
AUTHORIZED_USER_ADDRESS=your_wallet_address_here
```

### 1.3 Create Protected Data

```bash
# Create encrypted protected data
WALLET_PRIVATE_KEY=your_private_key node create-protected-data.js
```

**Expected Output**:
```
Protected data created successfully!
Protected Data Details:
  - Address: 0x1016cebd9CDFe9f4dF90e02ee5F9f319D82C1B4B
  - Owner: your_wallet_address
  - Name: Scoring Algorithm Input Data
  - Transaction ID: 0x...
```

### 1.4 Grant Access to iApp

```bash
# Grant access to the scoring algorithm
WALLET_PRIVATE_KEY=your_private_key \
PROTECTED_DATA_ADDRESS=0x1016cebd9CDFe9f4dF90e02ee5F9f319D82C1B4B \
IAPP_ADDRESS=0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d \
node grant-access.js
```

### 1.5 Test the Algorithm

**Local Testing**:
```bash
# Test with command line argument
iapp test --args "5"

# Test with requester secret
iapp test --requesterSecret 1=5
```

**Network Testing**:
```bash
# Test with protected data
iapp run 0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d --protectedData 0x1016cebd9CDFe9f4dF90e02ee5F9f319D82C1B4B

# Test with requester secret
iapp run 0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d --requesterSecret 1=5
```

## Part 2: Frontend Setup

### 2.1 Navigate to Frontend Directory

```bash
cd ../frontend
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Environment Configuration

**No `.env` file needed!** The frontend uses:
- Direct wallet connection (MetaMask)
- Hardcoded iApp address
- Dynamic protected data creation
- Public API endpoints

### 2.4 Configuration Check

Verify these constants in `src/components/TriggerTEETask.tsx`:

```typescript
const [iAppAddress] = useState<string>('0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d')

// Network configuration (auto-added to MetaMask)
chainId: '0x86',           // 134 in hex (Bellecour)
chainName: 'iExec Bellecour',
rpcUrls: ['https://bellecour.iex.ec'],
blockExplorerUrls: ['https://blockscout-bellecour.iex.ec'],
```

### 2.5 Start Development Server

```bash
npm run dev
```

**Access the application**:
- URL: http://localhost:3000
- The app will automatically detect and configure MetaMask for Bellecour network

## Part 3: Usage Workflow

### 3.1 Frontend Usage

1. **Open Browser**: Navigate to http://localhost:3000

2. **Connect Wallet**:
   - Click "Connect with MetaMask" 
   - Approve Bellecour network addition
   - Ensure wallet has some xRLC tokens

3. **Configure Input**:
   - Enter integer value (e.g., "5")
   - Choose input method:
     - ✅ **Protected Data**: Creates encrypted data (recommended)
     - ⚡ **Requester Secret**: Direct encrypted input

4. **Execute Computation**:
   - Click "Trigger TEE Computation"
   - Approve MetaMask transactions
   - Wait for TEE processing (1-3 minutes)

5. **View Results**:
   - Computation result displayed
   - Blockchain proof links
   - IPFS storage verification

### 3.2 Expected Results

**For input value `5`**:
```json
{
  "inputA": 5,
  "scoringFormula": "A * 2",
  "result": 10,
  "timestamp": "2025-09-02T...",
  "confidentialComputing": true,
  "teeProtected": true,
  "transactionHash": "0x..."
}
```

## Part 4: Production Deployment

### 4.1 Frontend Production Build

```bash
# In frontend directory
npm run build
npm start
```

**Access production build**: http://localhost:3000

### 4.2 TEE Algorithm Deployment

```bash
# In scoring-algorithm directory
iapp deploy
```

**This will**:
- Build Docker image
- Push to Docker Hub
- Deploy to iExec network
- Register on Bellecour blockchain

### 4.3 Environment Variables for Production

**Frontend** (optional `.env.local`):
```bash
# Production API endpoints
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

**Backend APIs**: Already configured for Bellecour network

## Part 5: Troubleshooting

### 5.1 Common Issues

**1. "Wallet not connected"**
- Solution: Ensure MetaMask is installed and unlocked
- Check: Bellecour network is added and selected

**2. "Insufficient xRLC balance"**  
- Solution: Get xRLC tokens from faucet or exchange
- Check: https://bellecour-faucet.iex.ec

**3. "Protected data creation failed"**
- Solution: Check private key in `.env` file
- Verify: Wallet has xRLC tokens for gas fees

**4. "Task execution timeout"**
- Solution: Check iExec Explorer for task status
- Wait: TEE processing can take 2-5 minutes

**5. "CLI command not found"**
- Solution: Install iApp CLI globally
```bash
npm install -g @iexec/iapp
```

### 5.2 Network Configuration

**Bellecour Network Details**:
- **Chain ID**: 134 (0x86 hex)
- **RPC**: https://bellecour.iex.ec
- **Explorer**: https://blockscout-bellecour.iex.ec
- **Symbol**: xRLC
- **Decimals**: 18

### 5.3 Debugging Tools

**Check iApp status**:
```bash
iapp info
```

**View task details**:
```bash
# Replace with actual task ID
iapp task show 0xc6b6be2c716a5ecc129ca5a1ed1fb584f941d6b9...
```

**Monitor wallet transactions**:
- Use Bellecour Explorer: https://blockscout-bellecour.iex.ec
- Search by wallet address or transaction hash

### 5.4 Development vs Production

**Development Mode**:
- Uses localhost:3000
- Mock data for testing
- Local protected data creation

**Production Mode**:
- Custom domain deployment
- Real blockchain transactions
- Production-grade error handling

## Part 6: API Endpoints Reference

### 6.1 Available Endpoints

**POST `/api/execute-task`**
```json
{
  "iAppAddress": "0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d",
  "useProtectedData": true,
  "protectedDataAddress": "0x...",
  "inputValue": "5",
  "userAddress": "0x..."
}
```

**GET `/api/fetch-transactions`**
- Query: `?walletAddress=0x...&iAppAddress=0x...`
- Returns: Recent transactions and status

**GET `/api/get-task-ipfs`** 
- Query: `?taskId=0x...`
- Returns: IPFS result data

### 6.2 Response Formats

**Successful Task Response**:
```json
{
  "deal": "0x...",
  "task": "0x...",
  "txHash": "0x...",
  "explorerUrl": "https://explorer.iex.ec/bellecour/task/0x...",
  "result": {
    "inputA": 5,
    "result": 10,
    "scoringFormula": "A * 2",
    "timestamp": "2025-09-02T...",
    "confidentialComputing": true,
    "teeProtected": true
  }
}
```

**Error Response**:
```json
{
  "error": "Task execution failed",
  "details": "Insufficient balance or network issue"
}
```

## Part 7: PM Quick Reference

### 7.1 Demo Script (5 minutes)

1. **Setup** (1 min): Open http://localhost:3000
2. **Connect** (1 min): Connect MetaMask, add Bellecour network
3. **Input** (1 min): Enter value "7", select Protected Data
4. **Execute** (2 min): Click trigger, show transaction progress
5. **Results** (30 sec): Display result "14" with blockchain proof

### 7.2 Key Talking Points

- **Privacy**: Input "7" is encrypted, never visible on blockchain
- **Security**: Computation happens in Intel SGX hardware enclave
- **Verification**: Result "14" is publicly verifiable on blockchain
- **Decentralization**: Runs on iExec network, not our servers

### 7.3 Live URLs

- **Frontend**: http://localhost:3000
- **Explorer**: https://explorer.iex.ec/bellecour
- **Network**: https://blockscout-bellecour.iex.ec
- **iApp**: `0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d`

### 7.4 Success Metrics

- ✅ Wallet connection successful
- ✅ Protected data creation (< 30 seconds)
- ✅ TEE task execution (< 3 minutes)
- ✅ Result retrieval and display
- ✅ Blockchain proof verification

This setup provides a complete confidential computing demonstration ready for PM review and client presentations.