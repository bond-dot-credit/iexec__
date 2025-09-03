# iExec Confidential Computing - Technical Implementation Guide

## Overview

This document provides a comprehensive technical overview of how the iExec confidential computing system works, including the scoring algorithm, data protection mechanisms, and TEE execution flow.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   iExec Network  │    │   TEE (SGX)     │
│   (Next.js)     │    │   (Blockchain)   │    │   Environment   │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • User Input    │───▶│ • Protected Data │───▶│ • Scoring Algo  │
│ • Wallet Conn   │    │ • Access Control │    │ • Data Decrypt  │
│ • Task Trigger  │    │ • Task Execution │    │ • Result Output │
│ • Result Display│◀───│ • IPFS Storage   │◀───│ • JSON Export   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Core Components

### 1. Scoring Algorithm (TEE Application)

**File**: `scoring-algorithm/src/app.js`

**Core Logic**:
```javascript
// Simple scoring: result = inputA * 2
result = inputA * 2;

// Output structure
{
  inputA: 5,
  scoringFormula: 'A * 2',
  result: 10,
  timestamp: '2025-09-02T...',
  confidentialComputing: true,
  teeProtected: true
}
```

**Input Sources (Priority Order)**:
1. **Protected Data**: Encrypted data via DataProtector SDK
2. **Requester Secret**: Direct encrypted input (`IEXEC_REQUESTER_SECRET_1`)
3. **CLI Arguments**: Fallback for testing (`process.argv[2]`)

**Key Features**:
- Multi-type support (f64, number, string conversion)
- Robust error handling with fallback mechanisms
- Structured JSON output for easy consumption
- TEE-specific logging and monitoring

### 2. Data Protection System

**Protected Data Creation** (`create-protected-data.js`):
```javascript
const protectedData = await dataProtectorCore.protectData({
  data: {
    integerA: 5,  // Encrypted client-side
    description: "Encrypted integer for scoring algorithm",
    source: "iExec scoring algorithm demo"
  },
  name: 'Scoring Algorithm Input Data'
});
```

**Access Control Management** (`grant-access.js`):
```javascript
const grantedAccess = await dataProtectorCore.grantAccess({
  protectedData: protectedDataAddress,
  authorizedApp: iAppAddress,
  authorizedUser: userWalletAddress,
  numberOfAccess: 10,
  pricePerAccess: 0
});
```

**Security Model**:
- **Client-side encryption**: Data encrypted before leaving user's device
- **On-chain access control**: Smart contract-based permission system
- **TEE decryption**: Only authorized TEE can decrypt data
- **Public results**: Output is unencrypted for transparency

### 3. Frontend Integration

**File**: `frontend/src/components/TriggerTEETask.tsx`

**Wallet Integration**:
- Automatic Bellecour network switching (Chain ID: 134)
- MetaMask/WalletConnect support via Wagmi
- DataProtector SDK initialization

**Task Execution Flow**:
```typescript
1. User inputs integer value
2. Choose: Protected Data OR Requester Secret
3. If Protected Data:
   - Create encrypted data object
   - Grant access to iApp
4. Call backend API (/api/execute-task)
5. Monitor blockchain for transaction completion
6. Display results with proof links
```

**Real-time Monitoring**:
- Transaction hash tracking
- Status polling every 5 seconds
- iExec Explorer integration
- IPFS result retrieval

### 4. API Endpoints

**Backend Services** (`frontend/src/app/api/`):

- **`/api/execute-task`**: Triggers iExec computation
- **`/api/fetch-transactions`**: Monitors wallet transactions
- **`/api/get-task-ipfs`**: Retrieves IPFS results
- **`/api/task-status`**: Checks task completion status

## Data Flow & Privacy

### Input Privacy Model

**What Goes On-Chain**:
- ✅ Protected data address: `0x1016cebd9CDFe9f4dF90e02ee5F9f319D82C1B4B`
- ✅ Access grants and permissions
- ✅ Task execution metadata
- ✅ Transaction hashes and timestamps

**What Stays Private**:
- ❌ Input value `A = 5` (encrypted)
- ❌ Intermediate calculations
- ❌ User private keys
- ❌ TEE internal state

**What Becomes Public**:
- ✅ Final result: `result = 10`
- ✅ Algorithm used: `A * 2`
- ✅ Execution timestamp
- ✅ TEE attestation proof

### Encryption Process

1. **Client-Side**: `inputA: 5` → AES encrypted blob
2. **Blockchain**: Store encrypted blob + metadata
3. **TEE Environment**: Decrypt using secure key
4. **Computation**: Process in hardware-isolated environment
5. **Output**: Unencrypted result to IPFS

## TEE (Trusted Execution Environment)

### Intel SGX Integration

**Container Setup**:
```dockerfile
FROM node:22-alpine3.21
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENTRYPOINT ["node", "--disable-wasm-trap-handler", "/app/src/app.js"]
```

**Environment Variables**:
- `IEXEC_OUT`: Output directory for results
- `IEXEC_APP_DEVELOPER_SECRET`: MEDPrivate key for decryption
- `IEXEC_REQUESTER_SECRET_1`: Alternative input method

**Security Guarantees**:
- Hardware-based isolation
- Encrypted memory execution
- Remote attestation capability
- Protection from node operators

### Data Deserialization

```javascript
const deserializer = new IExecDataProtectorDeserializer();

// Try multiple data types
const approaches = [
  () => deserializer.getValue('integerA', 'f64'),
  () => deserializer.getValue('integerA', 'number'), 
  () => deserializer.getValue('integerA', 'string')
];
```

## Configuration & Deployment

### iApp Configuration (`iapp.config.json`)

```json
{
  "defaultChain": "bellecour",
  "projectName": "scoring-algorithm",
  "template": "JavaScript",
  "dockerhubUsername": "ojasarora77",
  "walletPrivateKey": "779f2e...", // For deployment
  "appSecret": "MEDPRIVATE_KEY_12345_FOR_DECRYPTION"
}
```

### Network Details

- **Chain**: Bellecour (134)
- **RPC**: `https://bellecour.iex.ec`
- **Explorer**: `https://blockscout-bellecour.iex.ec`
- **iApp Address**: `0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d`

### Execution History

Recent successful runs (from `cache/bellecour/runs.json`):
```json
{
  "iAppAddress": "0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d",
  "dealid": "0x69f09dbbbfb5dc67514bf9e3856e9efd6bec4c25...",
  "taskid": "0xc6b6be2c716a5ecc129ca5a1ed1fb584f941d6b9...",
  "txHash": "0x6c5eec0ad6827bd36cf89fea8a1cf8e24455edba...",
  "date": "2025-09-02T20:44:51.651Z"
}
```

## Testing & Development

### Local Testing Commands

```bash
# Test with CLI argument
iapp test --args "5"

# Test with requester secret  
iapp test --requesterSecret 1=5

# Test with protected data
iapp run 0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d --protectedData 0x1016cebd9CDFe9f4dF90e02ee5F9f319D82C1B4B
```

### Mock Data for Development

**File**: `input/protectedDataMock`
```json
{"integerA": 5}
```

**Testing Script**: `test-deserializer.js`
- Tests DataProtector deserializer functionality
- Validates data type conversions
- Debugging for TEE data access

## Security Considerations

### Access Control
- Smart contract-based permissions
- Time-limited access grants
- User-specific authorization
- App-specific access control

### Data Integrity
- Cryptographic proof of execution
- Blockchain transaction verification
- IPFS content addressing
- TEE attestation reports

### Privacy Guarantees  
- Hardware-based confidentiality
- Client-side encryption
- Zero-knowledge of input data by node operators
- Selective result disclosure

## Current Limitations & Future Improvements

### Known Issues
1. **CLI Dependency**: Frontend relies on CLI commands vs direct SDK calls
2. **Error Handling**: CLI error parsing is fragile
3. **Real-time Updates**: Polling-based status checking
4. **Scalability**: Single algorithm implementation

### Recommended Enhancements
1. **Direct SDK Integration**: Replace CLI with iExec SDK calls
2. **WebSocket Updates**: Real-time task status streaming  
3. **Algorithm Marketplace**: Support multiple scoring algorithms
4. **Advanced Data Types**: Support for complex data structures
5. **Batch Processing**: Multiple input processing capability

This implementation provides a solid foundation for confidential computing applications while maintaining strong privacy guarantees and blockchain-based verification.