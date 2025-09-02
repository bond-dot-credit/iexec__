# iExec Scoring Algorithm - Usage Guide

## 🔐 Secure Setup

### 1. Environment Variables

Create a `.env` file in the project root (this file is ignored by git):

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
```bash
WALLET_PRIVATE_KEY=your_private_key_here
IAPP_ADDRESS=0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d
PROTECTED_DATA_ADDRESS=0x1016cebd9CDFe9f4dF90e02ee5F9f319D82C1B4B
AUTHORIZED_USER_ADDRESS=0xa5ebd895c62fb917d97c6f3e39a4562f1be5ceee
```

### 2. Install Dependencies

```bash
npm install
```

## 📦 Creating Protected Data

```bash
# Set your private key in .env file first
WALLET_PRIVATE_KEY=your_key node create-protected-data.js
```

This will:
- Create encrypted protected data with `integerA: 5`
- Return the protected data address
- Generate the data schema

## 🔑 Granting Access

```bash
# Set environment variables and run
WALLET_PRIVATE_KEY=your_key \
PROTECTED_DATA_ADDRESS=0x... \
IAPP_ADDRESS=0x... \
node grant-access.js
```

## 🚀 Running the iApp

### With Protected Data
```bash
iapp run 0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d --protectedData 0x1016cebd9CDFe9f4dF90e02ee5F9f319D82C1B4B
```

### With Requester Secrets (Alternative)
```bash
iapp run 0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d --requesterSecret 1=5
```

## 🔧 Development Commands

```bash
# Test locally
iapp test --args "5"

# Test with requester secret
iapp test --requesterSecret 1=5

# Deploy new version
iapp deploy
```

## 📊 Expected Output

```json
{
  "inputA": 5,
  "scoringFormula": "A * 2",
  "result": 10,
  "timestamp": "2025-09-01T09:22:15.922Z",
  "confidentialComputing": true,
  "teeProtected": true
}
```