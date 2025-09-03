# iExec Confidential Computing Frontend

Interactive web application for triggering TEE computations and displaying results from the iExec scoring algorithm.

## Features

### Core Functionality
• **Trigger TEE Tasks**: Submit confidential computations to iExec network
• **Score Retrieval**: Display real-time computation results  
• **Proof Display**: Show blockchain verification and IPFS storage links
• **Interactive UI**: Modern, responsive interface with real-time updates

### Input Methods
• **Protected Data**: Encrypt data using DataProtector SDK
• **Requester Secrets**: Direct encrypted input transmission
• **Dynamic Configuration**: Runtime selection of input methods

### Security Features
• **Client-Side Encryption**: All sensitive data encrypted before transmission
• **TEE Verification**: Hardware attestation display and validation
• **Blockchain Proof**: On-chain transaction verification
• **Privacy Indicators**: Visual confirmation of confidential computing status

## Technology Stack

• **Framework**: Next.js 15 with React 19
• **Styling**: Tailwind CSS with glass morphism design
• **Blockchain**: iExec DataProtector SDK integration
• **Wallet**: Ethers.js for Web3 interactions
• **TypeScript**: Full type safety and IntelliSense

## Quick Start

### Installation
```bash
cd frontend/iexec-scoring-frontend
npm install
```

### Environment Setup
```bash
# No environment variables needed for basic functionality
# Private keys are entered directly in the UI for DataProtector operations
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

## Component Architecture

### Main Components

• **`TriggerTEETask.tsx`**
  - Input value configuration
  - Protected data creation and access control
  - TEE task execution triggers
  - Loading states and error handling

• **`ScoreDisplay.tsx`**
  - Computation result visualization
  - Security indicator displays
  - Privacy guarantee information
  - Timestamp and formula details

• **`ProofDisplay.tsx`**
  - Blockchain transaction details
  - IPFS storage links
  - Copy-to-clipboard functionality
  - iExec explorer integration

### Key Features

• **Real-Time Updates**: Live computation status and progress indicators
• **Error Handling**: Comprehensive error states with user-friendly messages
• **Responsive Design**: Mobile-first approach with desktop optimization
• **Accessibility**: Screen reader support and keyboard navigation

## Usage Workflow

### Basic Operation
1. **Input Configuration**: Enter integer value for scoring computation
2. **Method Selection**: Choose between Protected Data or Requester Secret
3. **Authentication**: Provide private key for DataProtector operations (if needed)
4. **Task Execution**: Trigger TEE computation on iExec network
5. **Result Display**: View confidential computation results
6. **Proof Verification**: Examine blockchain proof and IPFS storage

### Advanced Features
• **Dynamic Protected Data**: Creates new protected data for each computation
• **Access Control Management**: Automatic access grant configuration
• **Multi-Method Support**: Seamless switching between input methods
• **Real-Time Status**: Live progress indicators during computation

## Integration Points

### Backend Integration
The frontend is designed to integrate with:
• iExec network via DataProtector SDK
• Blockchain explorers for transaction verification
• IPFS gateways for result storage
• Custom backend APIs for extended functionality

### Configuration
Key configuration parameters:
```typescript
const iAppAddress = '0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d'
const protectedDataAddress = '0x1016cebd9CDFe9f4dF90e02ee5F9f319D82C1B4B'
const explorerBaseUrl = 'https://explorer.iex.ec/bellecour'
const ipfsGatewayUrl = 'https://ipfs-gateway.v8-bellecour.iex.ec'
```

## Development

### Local Testing
The application includes simulation modes for testing without live blockchain interactions:
• Mock TEE computation responses
• Simulated blockchain transaction IDs
• Dummy IPFS hashes for development

### Production Deployment
For production use:
• Replace simulation functions with actual iExec API calls
• Configure proper error handling for network failures
• Implement user authentication and session management
• Add input validation and sanitization

### Customization
• **Styling**: Modify Tailwind CSS classes for custom themes
• **Components**: Extend or replace components for specific use cases  
• **Integration**: Add additional blockchain networks or TEE providers
• **Features**: Implement advanced scoring algorithms or data types

This frontend provides a complete interface for confidential computing operations while maintaining security and user experience standards.